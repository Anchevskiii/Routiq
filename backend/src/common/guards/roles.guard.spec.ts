import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: {
    getAllAndOverride: jest.Mock;
  };
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  const setupMockContext = (userRole?: string) => {
    const mockRequest = {
      user: {
        role: userRole,
      },
    };

    const mockHttp = {
      getRequest: () => mockRequest,
    };

    mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue('handler'),
      getClass: jest.fn().mockReturnValue('class'),
      switchToHttp: () => mockHttp as any,
    };
  };

  it('should return true if no required roles are defined', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    setupMockContext('MEMBER');

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);
    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      'handler',
      'class',
    ]);
  });

  it('should return true if user has one of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([GroupRole.ADMIN, GroupRole.OWNER]);
    setupMockContext('ADMIN');

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);
    expect(result).toBe(true);
  });

  it('should return false if user does not have any of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([GroupRole.OWNER]);
    setupMockContext('MEMBER');

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);
    expect(result).toBe(false);
  });
});
