import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Mock passport-jwt BEFORE importing the guard so the guard picks up the mock
const mockExtractToken = jest.fn();
jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: () => mockExtractToken,
  },
}));

import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from '../types/jwt-payload.type';

// ---------------------------------------------------------------------------
// Helpers to build a mock ExecutionContext
// ExtractJwt is mocked above so headers don't matter — we control
// what token the extractor returns via mockExtractToken directly.
// ---------------------------------------------------------------------------

function buildContext(handlerMeta = {}, classMeta = {}): ExecutionContext {
  const request: { user?: JwtPayload } = {};
  return {
    getHandler: () => handlerMeta,
    getClass: () => classMeta,
    switchToHttp: () => ({ getRequest: () => request }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

// Returns both ctx and the request object so tests can inspect request.user
function buildContextWithRequest(handlerMeta = {}, classMeta = {}) {
  const request: { user?: JwtPayload } = {};
  const ctx = {
    getHandler: () => handlerMeta,
    getClass: () => classMeta,
    switchToHttp: () => ({ getRequest: () => request }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
  return { ctx, request };
}

function bearerContext(token: string | null): ExecutionContext {
  const request: { user?: JwtPayload; headers: { authorization?: string } } = {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
    user: undefined,
  };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
};

const mockSupabaseService = {
  getClient: jest.fn<{ auth: { getUser: jest.Mock } } | null, []>(
    () => mockSupabaseClient,
  ),
};

const mockUsersService = {
  upsertUser: jest.fn(),
};

// Reflector: by default routes are NOT public
const mockReflector = {
  getAllAndOverride: jest.fn(() => false),
} as unknown as Reflector;

// ---------------------------------------------------------------------------
// Shared Supabase user fixture
// ---------------------------------------------------------------------------

const supabaseUser = {
  id: 'supabase-uid-123',
  email: 'test@example.com',
  role: 'authenticated',
  user_metadata: {
    name: 'Test User',
    avatar_url: 'https://example.com/pic.png',
  },
  app_metadata: {},
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    // Default: a token is present and the Supabase client is available.
    // Individual tests override these as needed.
    mockExtractToken.mockReturnValue('valid-token');
    mockSupabaseService.getClient.mockReturnValue(mockSupabaseClient);

    guard = new JwtAuthGuard(
      mockReflector,
      mockSupabaseService as unknown as never,
      mockUsersService as unknown as never,
    );
  });

  // =========================================================================
  // @Public() routes
  // =========================================================================

  describe('public routes', () => {
    beforeEach(() => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    });

    it('returns true immediately without touching Supabase', async () => {
      const result = await guard.canActivate(buildContext());

      expect(result).toBe(true);
      expect(mockSupabaseService.getClient).not.toHaveBeenCalled();
    });

    it('checks both handler and class metadata for the public key', async () => {
      const handler = {};
      const cls = {};
      const ctx = buildContext(handler, cls);

      await guard.canActivate(ctx);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        handler,
        cls,
      ]);
    });
  });

  // =========================================================================
  // Test-mode bypass
  // =========================================================================

  describe('test-mode bypass', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('returns true when NODE_ENV is test and request.user is already set', async () => {
      process.env.NODE_ENV = 'test';
      const { ctx, request } = buildContextWithRequest();
      request.user = {
        sub: 'test-user',
        email: 'test@example.com',
      } as JwtPayload;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockSupabaseService.getClient).not.toHaveBeenCalled();
      expect(mockExtractToken).not.toHaveBeenCalled();
    });

    it('does not bypass when NODE_ENV is not test', async () => {
      process.env.NODE_ENV = 'development';
      const { ctx, request } = buildContextWithRequest();
      request.user = {
        sub: 'test-user',
        email: 'test@example.com',
      } as JwtPayload;
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });

      await guard.canActivate(ctx);

      expect(mockSupabaseService.getClient).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Missing / malformed token
  // =========================================================================

  describe('missing token', () => {
    it('throws UnauthorizedException when no token is present', async () => {
      mockExtractToken.mockReturnValue(null);

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        new UnauthorizedException('Missing bearer token'),
      );
    });

    it('throws UnauthorizedException when token is an empty string', async () => {
      mockExtractToken.mockReturnValue('');

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('cookie token extraction', () => {
    it('extracts token from cookie when bearer token is missing', async () => {
      mockExtractToken.mockReturnValue(null);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });
      mockUsersService.upsertUser.mockResolvedValue(undefined);

      const request = {
        cookies: {
          'sb-access-token': 'cookie-token-123',
        },
      };
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => request }),
        getArgs: () => [],
        getArgByIndex: () => null,
        switchToRpc: () => ({}),
        switchToWs: () => ({}),
        getType: () => 'http',
      } as unknown as ExecutionContext;

      expect(await guard.canActivate(ctx)).toBe(true);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('cookie-token-123');
    });

    it('throws UnauthorizedException if both bearer and cookie are missing', async () => {
      mockExtractToken.mockReturnValue(null);

      const request = {
        cookies: {},
      };
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => request }),
        getArgs: () => [],
        getArgByIndex: () => null,
        switchToRpc: () => ({}),
        switchToWs: () => ({}),
        getType: () => 'http',
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Missing bearer token'),
      );
    });
  });

  describe('Supabase client unavailable', () => {
    it('throws UnauthorizedException when getClient returns null', async () => {
      mockSupabaseService.getClient.mockReturnValue(null);

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        new UnauthorizedException('Authentication service unavailable'),
      );
    });

    it('does not call getUser when client is unavailable', async () => {
      mockSupabaseService.getClient.mockReturnValue(null);

      await expect(guard.canActivate(buildContext())).rejects.toThrow();
      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Supabase token validation errors
  // =========================================================================

  describe('invalid / expired token', () => {
    it('throws UnauthorizedException when Supabase returns an error with a message', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        new UnauthorizedException('JWT expired'),
      );
    });

    it('uses fallback message when error object has no message', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: {},
      });

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );
    });

    it('throws UnauthorizedException when both user and error are null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(guard.canActivate(buildContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // =========================================================================
  // Happy path — valid token
  // =========================================================================

  describe('valid token', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });
      mockUsersService.upsertUser.mockResolvedValue(undefined);
    });

    it('returns true', async () => {
      expect(await guard.canActivate(buildContext())).toBe(true);
    });

    it('attaches a JwtPayload to request.user', async () => {
      const { ctx, request } = buildContextWithRequest();

      await guard.canActivate(ctx);

      expect(request.user).toBeDefined();
      expect(request.user?.sub).toBe(supabaseUser.id);
      expect(request.user?.email).toBe(supabaseUser.email);
      expect(request.user?.role).toBe(supabaseUser.role);
    });

    it('maps user_metadata and app_metadata onto request.user', async () => {
      const { ctx, request } = buildContextWithRequest();

      await guard.canActivate(ctx);

      expect(request.user?.user_metadata).toEqual(supabaseUser.user_metadata);
      expect(request.user?.app_metadata).toEqual(supabaseUser.app_metadata);
    });

    it('calls upsertUser with the resolved user data', async () => {
      await guard.canActivate(buildContext());

      expect(mockUsersService.upsertUser).toHaveBeenCalledWith({
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata.name,
        avatarUrl: supabaseUser.user_metadata.avatar_url,
      });
    });

    it('passes the extracted token to Supabase getUser', async () => {
      mockExtractToken.mockReturnValue('my-specific-token');

      await guard.canActivate(buildContext());

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(
        'my-specific-token',
      );
    });
  });

  // =========================================================================
  // Anonymous / phone-only users (no email)
  // =========================================================================

  describe('anonymous users', () => {
    const anonymousUser = {
      ...supabaseUser,
      email: undefined,
      user_metadata: {},
    };

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: anonymousUser },
        error: null,
      });
      mockUsersService.upsertUser.mockResolvedValue(undefined);
    });

    it('resolves email to <id>@anonymous.routiq.local when email is missing', async () => {
      const { ctx, request } = buildContextWithRequest();

      await guard.canActivate(ctx);

      expect(request.user).toBeDefined();
      expect(request.user?.email).toBe(
        `${anonymousUser.id}@anonymous.routiq.local`,
      );
    });

    it('calls upsertUser with the anonymous fallback email', async () => {
      await guard.canActivate(bearerContext('anon-token'));

      expect(mockUsersService.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: `${anonymousUser.id}@anonymous.routiq.local`,
        }),
      );
    });

    it('does not include name or avatarUrl when user_metadata is empty', async () => {
      await guard.canActivate(bearerContext('anon-token'));

      expect(mockUsersService.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          avatarUrl: undefined,
        }),
      );
    });
  });

  // =========================================================================
  // upsertUser failure — should NOT block the request
  // =========================================================================

  describe('upsertUser failure', () => {
    it('still returns true even when upsertUser throws', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });
      mockUsersService.upsertUser.mockRejectedValue(new Error('DB down'));

      const result = await guard.canActivate(bearerContext('valid-token'));

      // Guard swallows the sync error — request must not be blocked
      expect(result).toBe(true);
    });

    it('still attaches request.user even when upsertUser throws', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });
      mockUsersService.upsertUser.mockRejectedValue(new Error('DB down'));

      const { ctx, request } = buildContextWithRequest();
      await guard.canActivate(ctx);

      expect(request.user?.sub).toBe(supabaseUser.id);
    });
  });
});
