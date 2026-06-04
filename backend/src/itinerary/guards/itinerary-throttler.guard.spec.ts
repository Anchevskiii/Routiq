import { ItineraryThrottlerGuard } from './itinerary-throttler.guard';

// ---------------------------------------------------------------------------
// Mock ThrottlerGuard base class
// ---------------------------------------------------------------------------

jest.mock('@nestjs/throttler', () => ({
  ThrottlerGuard: class ThrottlerGuardMock {
    constructor(..._args: unknown[]) {}
  },
}));

// ---------------------------------------------------------------------------
// Helper — build guard instance
// ---------------------------------------------------------------------------

function buildGuard(): ItineraryThrottlerGuard {
  return new ItineraryThrottlerGuard(
    {} as unknown as import('@nestjs/throttler').ThrottlerModuleOptions,
    {} as unknown as import('@nestjs/throttler').ThrottlerStorage,
    {} as unknown as import('@nestjs/core').Reflector,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItineraryThrottlerGuard', () => {
  let guard: ItineraryThrottlerGuard;

  type GuardWithGetTracker = {
    getTracker: (req: Record<string, unknown>) => Promise<string>;
  };

  beforeEach(() => {
    guard = buildGuard();
  });

  it('returns user-based tracker key when user.sub is present', async () => {
    const req = {
      user: { sub: 'user-abc' },
      headers: {},
      ip: '127.0.0.1',
    };

    const tracker = await (guard as unknown as GuardWithGetTracker).getTracker(req);
    expect(tracker).toBe('user:user-abc');
  });

  it('returns ip-based key from x-forwarded-for header when user has no sub', async () => {
    const req = {
      user: {},
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
      ip: '127.0.0.1',
    };

    const tracker = await (guard as unknown as GuardWithGetTracker).getTracker(req);
    expect(tracker).toBe('ip:203.0.113.5');
  });

  it('returns ip-based key from req.ip when user and x-forwarded-for are absent', async () => {
    const req = {
      user: undefined,
      headers: {},
      ip: '10.0.0.1',
    };

    const tracker = await (guard as unknown as GuardWithGetTracker).getTracker(req);
    expect(tracker).toBe('ip:10.0.0.1');
  });

  it('falls back to ip:unknown when req.ip is also absent', async () => {
    const req = {
      user: undefined,
      headers: {},
      ip: undefined,
    };

    const tracker = await (guard as unknown as GuardWithGetTracker).getTracker(req);
    expect(tracker).toBe('ip:unknown');
  });

  it('returns ip-based key when user.sub is an empty string', async () => {
    const req = {
      user: { sub: '' },
      headers: {},
      ip: '192.168.1.1',
    };

    const tracker = await (guard as unknown as GuardWithGetTracker).getTracker(req);
    // Empty sub doesn't satisfy userId.length > 0, so falls through to ip
    expect(tracker).toBe('ip:192.168.1.1');
  });
});
