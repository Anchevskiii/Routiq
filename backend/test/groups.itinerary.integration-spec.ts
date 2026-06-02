import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GroupsService } from '../src/groups/groups.service';
import { MailService } from '../src/mail/mail.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestItinerary, createTestUser } from './test-data';

describe('GroupsService (integration)', () => {
  let prisma: PrismaService;
  let groupsService: GroupsService;

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
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('creates a group and attaches an itinerary', async () => {
    const user = await createTestUser(prisma);
    const itinerary = await createTestItinerary(prisma, user.id, {
      destination: 'Prague',
    });

    const group = await groupsService.createGroup(user.id, {
      name: 'Integration Group',
    });

    const groupItinerary = await groupsService.addItineraryToGroup(
      group.id,
      user.id,
      itinerary.id,
    );

    expect(groupItinerary.itinerary.id).toBe(itinerary.id);

    const details = await groupsService.getGroupById(group.id, user.id);
    expect(details.itineraries.length).toBe(1);
  });
});
