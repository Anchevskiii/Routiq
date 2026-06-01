import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InvitationStatus } from '@prisma/client';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GroupsService } from '../../src/groups/groups.service';
import { MailService } from '../../src/mail/mail.service';
import { createTestUser } from '../test-data';

describe('GroupsService (integration - invitations)', () => {
  let prisma: PrismaService;
  let groupsService: GroupsService;
  let ownerId: string;
  let inviteeId: string;
  let inviteeEmail: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
      providers: [
        GroupsService,
        {
          provide: MailService,
          useValue: { sendGroupInvitation: jest.fn() },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    groupsService = moduleRef.get(GroupsService);
    await prisma.onModuleInit();

    const owner = await createTestUser(prisma);
    const invitee = await createTestUser(prisma);
    ownerId = owner.id;
    inviteeId = invitee.id;
    inviteeEmail = invitee.email;
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  async function createGroup() {
    return groupsService.createGroup(ownerId, {
      name: `Invitations ${Date.now()}`,
    });
  }

  it('transitions PENDING to ACCEPTED', async () => {
    const group = await createGroup();

    await groupsService.inviteMember(group.id, ownerId, {
      email: inviteeEmail,
    });

    const accepted = await groupsService.acceptInvitation(group.id, inviteeId);

    expect(accepted.status).toBe(InvitationStatus.ACCEPTED);

    const persisted = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId: inviteeId },
    });
    expect(persisted?.status).toBe(InvitationStatus.ACCEPTED);
  });

  it('transitions PENDING to DECLINED and blocks acceptance', async () => {
    const group = await createGroup();

    await groupsService.inviteMember(group.id, ownerId, {
      email: inviteeEmail,
    });

    const declined = await groupsService.declineInvitation(group.id, inviteeId);

    expect(declined.status).toBe(InvitationStatus.DECLINED);

    await expect(
      groupsService.acceptInvitation(group.id, inviteeId),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks accepting expired invitations', async () => {
    const group = await createGroup();

    await groupsService.inviteMember(group.id, ownerId, {
      email: inviteeEmail,
    });

    const pending = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId: inviteeId },
    });

    if (!pending) {
      throw new Error('Expected pending membership to exist');
    }

    await prisma.groupMember.update({
      where: { id: pending.id },
      data: { status: InvitationStatus.EXPIRED },
    });

    await expect(
      groupsService.acceptInvitation(group.id, inviteeId),
    ).rejects.toThrow(NotFoundException);
  });

  it('re-invites declined members back to PENDING', async () => {
    const group = await createGroup();

    await groupsService.inviteMember(group.id, ownerId, {
      email: inviteeEmail,
    });

    await groupsService.declineInvitation(group.id, inviteeId);

    const reinvited = await groupsService.inviteMember(group.id, ownerId, {
      email: inviteeEmail,
    });

    expect(reinvited.status).toBe(InvitationStatus.PENDING);
  });
});
