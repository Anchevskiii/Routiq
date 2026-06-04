import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => {
      return {
        end: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

jest.mock('@prisma/adapter-pg', () => {
  return {
    PrismaPg: jest.fn(),
  };
});

const mockExtendedClient = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn(),
  user: {},
  itinerary: {},
  itineraryDay: {},
  itineraryActivity: {},
  itineraryWeatherSnapshot: {},
  itineraryTip: {},
  group: {},
  groupMember: {},
  groupItinerary: {},
  comment: {},
  commentReaction: {},
  vote: {},
  activityLog: {},
  calendarExport: {},
  notification: {},
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $extends: jest.fn().mockReturnValue(mockExtendedClient),
      };
    }),
    Prisma: {
      getExtensionContext: jest.fn(),
    },
  };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      get: jest.fn().mockReturnValue('postgresql://localhost:5432/db'),
    };
    service = new PrismaService(mockConfigService as unknown as ConfigService);
  });

  it('should initialize and establish connection', async () => {
    await service.onModuleInit();
    expect(mockExtendedClient.$connect).toHaveBeenCalled();
  });

  it('should disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    expect(mockExtendedClient.$disconnect).toHaveBeenCalled();
  });

  it('should delegate getters to extendedClient', () => {
    expect(service.user).toBe(mockExtendedClient.user);
    expect(service.itinerary).toBe(mockExtendedClient.itinerary);
    expect(service.itineraryDay).toBe(mockExtendedClient.itineraryDay);
    expect(service.itineraryActivity).toBe(
      mockExtendedClient.itineraryActivity,
    );
    expect(service.itineraryWeatherSnapshot).toBe(
      mockExtendedClient.itineraryWeatherSnapshot,
    );
    expect(service.itineraryTip).toBe(mockExtendedClient.itineraryTip);
    expect(service.group).toBe(mockExtendedClient.group);
    expect(service.groupMember).toBe(mockExtendedClient.groupMember);
    expect(service.groupItinerary).toBe(mockExtendedClient.groupItinerary);
    expect(service.comment).toBe(mockExtendedClient.comment);
    expect(service.commentReaction).toBe(mockExtendedClient.commentReaction);
    expect(service.vote).toBe(mockExtendedClient.vote);
    expect(service.activityLog).toBe(mockExtendedClient.activityLog);
    expect(service.calendarExport).toBe(mockExtendedClient.calendarExport);
    expect(service.notification).toBe(mockExtendedClient.notification);
    expect(service.$transaction).toBeDefined();
  });
});
