import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppThrottlerGuard } from './app-throttler.guard';

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    guard = new AppThrottlerGuard(
      {} as any,
      {} as any,
      reflector,
    );
  });

  describe('getTracker', () => {
    it('returns user-based tracker key when user.sub is present', async () => {
      const req = {
        user: { sub: 'user-123' },
        headers: {},
        ip: '127.0.0.1',
      };

      const result = await (guard as any).getTracker(req);
      expect(result).toBe('user:user-123');
    });

    it('returns ip-based tracker key from x-forwarded-for header when user has no sub', async () => {
      const req = {
        user: {},
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
      };

      const result = await (guard as any).getTracker(req);
      expect(result).toBe('ip:192.168.1.1');
    });

    it('returns ip-based key from req.ip when user and x-forwarded-for are absent', async () => {
      const req = {
        user: undefined,
        headers: {},
        ip: '10.0.0.1',
      };

      const result = await (guard as any).getTracker(req);
      expect(result).toBe('ip:10.0.0.1');
    });

    it('falls back to ip:unknown when req.ip is also absent', async () => {
      const req = {
        user: undefined,
        headers: {},
        ip: undefined,
      };

      const result = await (guard as any).getTracker(req);
      expect(result).toBe('ip:unknown');
    });
  });

  describe('handleRequest', () => {
    let mockContext: ExecutionContext;
    let mockSuperHandleRequest: jest.SpyInstance;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn().mockReturnValue('mockHandler'),
        getClass: jest.fn().mockReturnValue('mockClass'),
      } as unknown as ExecutionContext;

      mockSuperHandleRequest = jest
        .spyOn(Object.getPrototypeOf(AppThrottlerGuard.prototype), 'handleRequest')
        .mockResolvedValue(true);
    });

    afterEach(() => {
      mockSuperHandleRequest.mockRestore();
    });

    it('should skip rate limiting for non-default throttlers if there is no throttle metadata on the handler/class', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await (guard as any).handleRequest(
        mockContext,
        5,
        60000,
        { name: 'itinerary-generate' },
        jest.fn(),
        jest.fn(),
      );

      expect(result).toBe(true);
      expect(mockSuperHandleRequest).not.toHaveBeenCalled();
    });

    it('should run rate limiting for default throttler even if there is no throttle metadata', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await (guard as any).handleRequest(
        mockContext,
        500,
        60000,
        { name: 'default' },
        jest.fn(),
        jest.fn(),
      );

      expect(result).toBe(true);
      expect(mockSuperHandleRequest).toHaveBeenCalled();
    });

    it('should run rate limiting for non-default throttler if there is throttle metadata present', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (typeof key === 'string' && key.includes('LIMIT')) {
          return 5;
        }
        return undefined;
      });

      const result = await (guard as any).handleRequest(
        mockContext,
        5,
        60000,
        { name: 'itinerary-generate' },
        jest.fn(),
        jest.fn(),
      );

      expect(result).toBe(true);
      expect(mockSuperHandleRequest).toHaveBeenCalled();
    });
  });
});
