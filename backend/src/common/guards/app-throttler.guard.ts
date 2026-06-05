import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { sub?: string };
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as RequestWithUser;
    const userId = request.user?.sub;
    if (typeof userId === 'string' && userId.length > 0) {
      return `user:${userId}`;
    }

    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      const first = forwardedFor.split(',')[0]?.trim();
      if (first) {
        return `ip:${first}`;
      }
    }

    return `ip:${request.ip ?? 'unknown'}`;
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
    getTracker: any,
    generateKey: any,
  ): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check if there is specific throttler limit or ttl metadata for this named throttler on this handler/class.
    const hasLimit = this.reflector.getAllAndOverride(
      `THROTTLER:LIMIT${throttler.name}`,
      [handler, classRef],
    );
    const hasTtl = this.reflector.getAllAndOverride(
      `THROTTLER:TTL${throttler.name}`,
      [handler, classRef],
    );

    // If this is not the 'default' throttler, and the endpoint does NOT have explicit override metadata for it, skip it!
    if (throttler.name !== 'default' && hasLimit === undefined && hasTtl === undefined) {
      return true;
    }

    return super.handleRequest(context, limit, ttl, throttler, getTracker, generateKey);
  }
}
