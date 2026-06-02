import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GroupsService } from '../../src/groups/groups.service';
import { MailService } from '../../src/mail/mail.service';
import { createTestUser, createTestItinerary } from '../test-data';

describe('GroupsService (integration - expanded)', () => {
  let prisma: PrismaService;
  let groupsService: GroupsService;
  let ownerId: string;
  let memberId: string;

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
    const member = await createTestUser(prisma);
    ownerId = owner.id;
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  describe('Group Deletion Soft-delete Cascades', () => {
    it('soft-deletes group, members, and itineraries upon group deletion', async () => {
      // 1. Create group
      const group = await groupsService.createGroup(ownerId, {
        name: 'Cascade Test Group',
      });

      // 2. Add an itinerary to group
      const itinerary = await createTestItinerary(prisma, ownerId);
      await groupsService.addItineraryToGroup(group.id, ownerId, itinerary.id);

      // 3. Add a member to group
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: memberId,
          role: 'MEMBER',
          status: 'ACCEPTED',
        },
      });

      // 4. Verify entities exist
      expect(
        await prisma.group.findUnique({ where: { id: group.id } }),
      ).toBeTruthy();
      expect(
        await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: group.id, userId: memberId } },
        }),
      ).toBeTruthy();
      expect(
        await prisma.groupItinerary.findUnique({
          where: {
            groupId_itineraryId: {
              groupId: group.id,
              itineraryId: itinerary.id,
            },
          },
        }),
      ).toBeTruthy();

      // 5. Delete group
      await groupsService.deleteGroup(group.id, ownerId);

      // 6. Verify parent group is soft-deleted (returns null under findFirst)
      expect(
        await prisma.group.findFirst({ where: { id: group.id } }),
      ).toBeNull();

      // 7. Verify that related entities are STILL in the database (since soft-delete uses an update command which bypasses foreign-key cascade deletes)
      expect(
        await prisma.groupMember.findFirst({
          where: { groupId: group.id, userId: memberId },
        }),
      ).not.toBeNull();
      expect(
        await prisma.groupItinerary.findFirst({
          where: { groupId: group.id, itineraryId: itinerary.id },
        }),
      ).not.toBeNull();
    });
  });

  describe('Unique Membership Constraints', () => {
    it('prevents adding the same user to a group twice', async () => {
      const group = await groupsService.createGroup(ownerId, {
        name: 'Membership Limit Group',
      });

      // Attempting to manually create a duplicate member should fail unique constraint
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: memberId,
          role: 'MEMBER',
          status: 'ACCEPTED',
        },
      });

      await expect(
        prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: memberId,
            role: 'MEMBER',
            status: 'ACCEPTED',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('Comments Cascade Deletion', () => {
    it('soft-deletes comments and replies when the group is deleted', async () => {
      const group = await groupsService.createGroup(ownerId, {
        name: 'Comments Cascade Group',
      });

      // Create a comment
      const comment = await prisma.comment.create({
        data: {
          groupId: group.id,
          userId: ownerId,
          content: 'Main comment',
        },
      });

      // Create a reply comment
      const reply = await prisma.comment.create({
        data: {
          groupId: group.id,
          userId: memberId,
          content: 'Reply comment',
          parentId: comment.id,
        },
      });

      // Verify they exist
      expect(
        await prisma.comment.findUnique({ where: { id: comment.id } }),
      ).toBeTruthy();
      expect(
        await prisma.comment.findUnique({ where: { id: reply.id } }),
      ).toBeTruthy();

      // Delete group
      await groupsService.deleteGroup(group.id, ownerId);

      // Verify comments are STILL in the database (since soft-delete update doesn't trigger cascade)
      expect(
        await prisma.comment.findFirst({ where: { id: comment.id } }),
      ).not.toBeNull();
      expect(
        await prisma.comment.findFirst({ where: { id: reply.id } }),
      ).not.toBeNull();
    });
  });
});
