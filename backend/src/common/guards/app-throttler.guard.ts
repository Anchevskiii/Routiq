import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerGenerateKeyFunction,
  ThrottlerGetTrackerFunction,
  ThrottlerOptions,
} from '@nestjs/throttler';
import { Request, Response } from 'express';

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
    getTracker: ThrottlerGetTrackerFunction,
    generateKey: ThrottlerGenerateKeyFunction,
  ): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    const hasLimit = this.reflector.getAllAndOverride(
      `THROTTLER:LIMIT${throttler.name}`,
      [handler, classRef],
    );
    const hasTtl = this.reflector.getAllAndOverride(
      `THROTTLER:TTL${throttler.name}`,
      [handler, classRef],
    );

    if (
      throttler.name !== 'default' &&
      hasLimit === undefined &&
      hasTtl === undefined
    ) {
      return true;
    }

    const result = await super.handleRequest(
      context,
      limit,
      ttl,
      throttler,
      getTracker,
      generateKey,
    );

    // The base class already sets RateLimit-* headers.
    // Add X-RateLimit-* alias and Retry-After for over-limit responses.
    this.addRateLimitHeaders(context, !result);

    return result;
  }

  private addRateLimitHeaders(
    context: ExecutionContext,
    isOverLimit: boolean,
  ): void {
    try {
      const res = context.switchToHttp().getResponse<Response>();
      if (res.headersSent) return;

      const existingLimit = res.getHeader('RateLimit-Limit');
      const existingRemaining = res.getHeader('RateLimit-Remaining');
      const existingReset = res.getHeader('RateLimit-Reset');

      if (existingLimit !== undefined) {
        res.setHeader('X-RateLimit-Limit', existingLimit);
      }
      if (existingRemaining !== undefined) {
        res.setHeader('X-RateLimit-Remaining', existingRemaining);
      }
      if (existingReset !== undefined) {
        res.setHeader('X-RateLimit-Reset', existingReset);
        if (isOverLimit) {
          const resetDate = new Date(existingReset as string);
          const retryAfter = Math.ceil(
            (resetDate.getTime() - Date.now()) / 1000,
          );
          res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
        }
      }
    } catch {
      // Headers are best-effort, never break the request flow
    }
  }
}
