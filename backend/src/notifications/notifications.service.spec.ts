import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: {
    user: { findUnique: jest.Mock };
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    itinerary: { findMany: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      itinerary: {
        findMany: jest.fn(),
      },
    };
    service = new NotificationsService(mockPrisma as unknown as PrismaService);
  });

  describe('createNotification', () => {
    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const res = await service.createNotification(
        'u1',
        NotificationType.VOTE,
        'title',
      );
      expect(res).toBeNull();
    });

    it('should return null if type is disabled in user settings', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: {
          votes: false,
        },
      });
      const res = await service.createNotification(
        'u1',
        NotificationType.VOTE,
        'title',
      );
      expect(res).toBeNull();
    });

    it('should create notification if user setting is enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: {
          votes: true,
        },
      });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1' });
      const res = await service.createNotification(
        'u1',
        NotificationType.VOTE,
        'title',
        'body',
        { some: 'data' },
      );
      expect(res).toEqual({ id: 'n1' });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: NotificationType.VOTE,
          title: 'title',
          body: 'body',
          data: { some: 'data' },
        },
      });
    });

    it('should fallback to default settings if metadata is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ metadata: null });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n2' });
      const res = await service.createNotification(
        'u1',
        NotificationType.VOTE,
        'title',
      );
      expect(res).toEqual({ id: 'n2' });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: NotificationType.VOTE,
          title: 'title',
          body: undefined,
          data: {},
        },
      });
    });

    it('should fallback to default settings if metadata is empty', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ metadata: {} });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n3' });
      const res = await service.createNotification(
        'u1',
        NotificationType.VOTE,
        'title',
      );
      expect(res).toEqual({ id: 'n3' });
    });
  });

  describe('getUserNotifications', () => {
    it('should fetch paginated notifications, total, and unread counts', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      mockPrisma.notification.count.mockImplementation(
        (args: { where?: { readAt?: unknown } }) => {
          if (args?.where?.readAt === null) return Promise.resolve(1);
          return Promise.resolve(2);
        },
      );

      const res = await service.getUserNotifications('u1', 2, 10);
      expect(res).toEqual({
        notifications: [{ id: 'n1' }],
        total: 2,
        unread: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
        skip: 10,
        take: 10,
      });
    });

    it('should use default page and limit values if omitted', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);
      const res = await service.getUserNotifications('u1');
      expect(res.page).toBe(1);
      expect(res.limit).toBe(20);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);
      const res = await service.getUnreadCount('u1');
      expect(res).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'u1', readAt: null },
      });
    });
  });

  describe('markRead', () => {
    it('should throw NotFoundException if notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      await expect(service.markRead('n1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update notification readAt', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'n1' });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'n1',
        readAt: new Date(),
      });
      const res = await service.markRead('n1', 'u1');
      expect(res).toBeDefined();
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllRead', () => {
    it('should update all unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });
      const res = await service.markAllRead('u1');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('checkTripReminders', () => {
    it('should do nothing if there are no upcoming trips', async () => {
      mockPrisma.itinerary.findMany.mockResolvedValue([]);
      const spy = jest.spyOn(service, 'createNotification');
      await service.checkTripReminders();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should send reminder notifications for upcoming trips', async () => {
      const trip = {
        id: 'trip1',
        userId: 'u1',
        destination: 'Paris',
        startDate: new Date(),
      };
      mockPrisma.itinerary.findMany.mockResolvedValue([trip]);
      mockPrisma.user.findUnique.mockResolvedValue({ metadata: {} });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1' });

      await service.checkTripReminders();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: NotificationType.TRIP_REMINDER,
          title: 'Your trip to Paris starts tomorrow!',
          body: "Don't forget to check your itinerary.",
          data: { itineraryId: 'trip1' },
        },
      });
    });

    it('should log warning if sending reminder fails', async () => {
      const trip = {
        id: 'trip1',
        userId: 'u1',
        destination: 'Paris',
        startDate: new Date(),
      };
      mockPrisma.itinerary.findMany.mockResolvedValue([trip]);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const spyWarn = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();
      await service.checkTripReminders();
      expect(spyWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send trip reminder for trip1'),
      );
    });
  });
});
