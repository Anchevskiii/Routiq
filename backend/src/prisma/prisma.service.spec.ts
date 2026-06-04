import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

type PrismaQueryArgs = {
  model: string;
  operation?: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
};

type PrismaDeleteArgs = {
  model: string;
  args: { where: Record<string, unknown> };
  query: jest.Mock;
};

interface PrismaAllModels {
  findFirst: (args: PrismaQueryArgs) => Promise<unknown>;
  findMany: (args: PrismaQueryArgs) => Promise<unknown>;
  update: (args: PrismaQueryArgs) => Promise<unknown>;
  updateMany: (args: PrismaQueryArgs) => Promise<unknown>;
  delete: (this: unknown, args: PrismaDeleteArgs) => Promise<unknown>;
  deleteMany: (this: unknown, args: PrismaDeleteArgs) => Promise<unknown>;
}

interface PrismaExtension {
  query: {
    $allModels: PrismaAllModels;
  };
}

let capturedExtensions: PrismaExtension | null = null;

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
        $extends: jest.fn().mockImplementation((ext) => {
          capturedExtensions = ext;
          return mockExtendedClient;
        }),
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

  const getExtensions = (): PrismaExtension => {
    if (!capturedExtensions) {
      throw new Error('capturedExtensions was not set by $extends mock');
    }
    return capturedExtensions;
  };

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

  describe('Prisma Extensions', () => {
    it('should append deletedAt: null to findFirst query on soft-delete models', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });
      const args = { where: { id: 1 } };

      const result = await getExtensions().query.$allModels.findFirst({
        model: 'User',
        args,
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should not append deletedAt: null to findFirst query on non-soft-delete models', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });
      const args = { where: { id: 1 } };

      const result = await getExtensions().query.$allModels.findFirst({
        model: 'Dummy',
        args,
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith(args);
      expect(result).toEqual({ id: 1 });
    });

    it('should append deletedAt: null to findMany query', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1 }]);

      await getExtensions().query.$allModels.findMany({
        model: 'User',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should not append deletedAt: null to findMany query on non-soft-delete models', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1 }]);

      await getExtensions().query.$allModels.findMany({
        model: 'Dummy',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({});
    });

    it('should append deletedAt: null to update query', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });

      await getExtensions().query.$allModels.update({
        model: 'User',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should not append deletedAt: null to update query on non-soft-delete models', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });

      await getExtensions().query.$allModels.update({
        model: 'Dummy',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({});
    });

    it('should append deletedAt: null to updateMany query', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ count: 1 });

      await getExtensions().query.$allModels.updateMany({
        model: 'User',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should not append deletedAt: null to updateMany query on non-soft-delete models', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ count: 1 });

      await getExtensions().query.$allModels.updateMany({
        model: 'Dummy',
        args: {},
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({});
    });

    it('should intercept delete and perform updateMany soft-delete instead', async () => {
      const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockClient = {
        user: {
          updateMany: mockUpdateMany,
        },
      };

      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn();

      const result = await getExtensions().query.$allModels.delete.call(
        mockClient,
        {
          model: 'User',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({});
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should fallback to default query for delete if model delegate updateMany is missing', async () => {
      const mockClient = {};
      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });

      const result = await getExtensions().query.$allModels.delete.call(
        mockClient,
        {
          model: 'User',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('should fallback to default query for delete if model is not in soft-delete set', async () => {
      const mockClient = {};
      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 });

      const result = await getExtensions().query.$allModels.delete.call(
        mockClient,
        {
          model: 'Dummy',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('should intercept deleteMany and perform updateMany soft-delete instead', async () => {
      const mockUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockClient = {
        user: {
          updateMany: mockUpdateMany,
        },
      };

      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn();

      const result = await getExtensions().query.$allModels.deleteMany.call(
        mockClient,
        {
          model: 'User',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ count: 1 });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should fallback to default query for deleteMany if model delegate updateMany is missing', async () => {
      const mockClient = {};
      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn().mockResolvedValue({ count: 1 });

      const result = await getExtensions().query.$allModels.deleteMany.call(
        mockClient,
        {
          model: 'User',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });

    it('should fallback to default query for deleteMany if model is not in soft-delete set', async () => {
      const mockClient = {};
      (Prisma.getExtensionContext as jest.Mock).mockReturnValue(mockClient);
      const mockQuery = jest.fn().mockResolvedValue({ count: 1 });

      const result = await getExtensions().query.$allModels.deleteMany.call(
        mockClient,
        {
          model: 'Dummy',
          args: { where: { id: 1 } },
          query: mockQuery,
        },
      );
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });
});
