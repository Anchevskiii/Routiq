import { JwtPayload } from '../common/types/jwt-payload.type';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockService: {
    getUserNotifications: jest.Mock;
    getUnreadCount: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
    controller = new NotificationsController(
      mockService as unknown as NotificationsService,
    );
  });

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  describe('getUserNotifications', () => {
    it('should call getUserNotifications with user sub and pagination params', async () => {
      mockService.getUserNotifications.mockResolvedValue({ notifications: [] });
      const res = await controller.getUserNotifications(mockUser, 2, 15);
      expect(res).toEqual({ notifications: [] });
      expect(mockService.getUserNotifications).toHaveBeenCalledWith(
        'user-123',
        2,
        15,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count response object', async () => {
      mockService.getUnreadCount.mockResolvedValue(3);
      const res = await controller.getUnreadCount(mockUser);
      expect(res).toEqual({ count: 3 });
      expect(mockService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });
  });

  describe('markRead', () => {
    it('should mark single notification as read', async () => {
      mockService.markRead.mockResolvedValue({ id: 'notif-1' });
      const res = await controller.markRead('notif-1', mockUser);
      expect(res).toEqual({ id: 'notif-1' });
      expect(mockService.markRead).toHaveBeenCalledWith('notif-1', 'user-123');
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', async () => {
      mockService.markAllRead.mockResolvedValue({ success: true });
      const res = await controller.markAllRead(mockUser);
      expect(res).toEqual({ success: true });
      expect(mockService.markAllRead).toHaveBeenCalledWith('user-123');
    });
  });
});
