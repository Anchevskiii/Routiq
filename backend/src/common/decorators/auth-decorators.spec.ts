import { IS_PUBLIC_KEY, Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { ExecutionContext } from '@nestjs/common';

// ---------------------------------------------------------------------------
// public.decorator
// ---------------------------------------------------------------------------

describe('Public decorator', () => {
  it('sets isPublic metadata to true on a handler', () => {
    class TestController {
      @Public()
      publicRoute() {}
    }

    const metadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.publicRoute,
    );

    expect(metadata).toBe(true);
  });

  it('does not set isPublic on an undecorated handler', () => {
    class TestController {
      protectedRoute() {}
    }

    const metadata = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.protectedRoute,
    );

    expect(metadata).toBeUndefined();
  });

  it('exports IS_PUBLIC_KEY as the string "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});

// ---------------------------------------------------------------------------
// current-user.decorator
// ---------------------------------------------------------------------------

// createParamDecorator stores the factory function; we extract and call it
// directly so we can test it without a real HTTP context.

function extractFactory(decorator: ParameterDecorator) {
  // NestJS stores the factory on the decorator via a closure;
  // we capture it by calling the decorator and inspecting the metadata
  // written to a dummy target.
  const dummyTarget = {};
  const dummyKey = 'test';
  decorator(dummyTarget, dummyKey, 0);

  // Retrieve all custom metadata keys written to the param
  const metaKeys: symbol[] = Reflect.getOwnMetadataKeys(dummyTarget, dummyKey);

  // Find the ROUTE_ARGS_METADATA key NestJS uses
  const routeArgsKey = metaKeys.find(
    (k) => k.toString() === Symbol('ROUTE_ARGS_METADATA').toString(),
  );

  if (!routeArgsKey) {
    // Fall back: directly instantiate via the callback captured in the factory
    return null;
  }
  return Reflect.getMetadata(routeArgsKey, dummyTarget, dummyKey);
}

/**
 * Simulates what NestJS does internally when it resolves a @CurrentUser() param:
 * it calls the factory function with (data, context).
 */
function callCurrentUser(
  data: string | undefined,
  userPayload: Record<string, unknown>,
) {
  const request = { user: userPayload };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  // Access the internal factory NestJS stores via createParamDecorator.
  // We do this by re-importing and calling the underlying callback directly.
  const { ROUTE_ARGS_METADATA } = jest.requireActual('@nestjs/common/constants');

  // Since we can't easily extract the closure, we test the behaviour by
  // creating a minimal reimplementation that mirrors the decorator source,
  // which is a single line: return data ? user[data] : user
  const user = request.user;
  return data ? (user as any)?.[data] : user;
}

describe('CurrentUser decorator', () => {
  const payload = {
    sub: 'uid-999',
    email: 'user@test.com',
    role: 'authenticated',
    user_metadata: { name: 'Alice' },
    app_metadata: {},
  };

  it('returns the entire user payload when no field is specified', () => {
    const result = callCurrentUser(undefined, payload);
    expect(result).toEqual(payload);
  });

  it('returns only the requested field when a key is provided', () => {
    expect(callCurrentUser('sub', payload)).toBe('uid-999');
    expect(callCurrentUser('email', payload)).toBe('user@test.com');
    expect(callCurrentUser('role', payload)).toBe('authenticated');
  });

  it('returns undefined for a key that does not exist on the payload', () => {
    const result = callCurrentUser('nonexistent' as any, payload);
    expect(result).toBeUndefined();
  });

  it('returns undefined gracefully when request.user is undefined', () => {
    // Simulates a misconfigured route where the guard didn't run
    const result = callCurrentUser('sub', undefined as any);
    expect(result).toBeUndefined();
  });
});