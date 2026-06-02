import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { SupabaseService } from '../../supabase/supabase.service';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

/** Placeholder domain for Supabase identities without an email claim (phone-only etc.). */
const ANONYMOUS_EMAIL_SUFFIX = '@anonymous.routiq.local';

/** Helper to extract Supabase access token from cookie */
function extractTokenFromCookie(request: Request): string | null {
  if (!request.cookies) {
    return null;
  }
  // Hardening: Only allow cookie auth for safe HTTP methods (GET, HEAD, OPTIONS)
  // to completely prevent CSRF attacks on write/delete operations.
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (request.method && !safeMethods.includes(request.method.toUpperCase())) {
    return null;
  }
  return request.cookies['sb-access-token'] ?? null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (process.env.NODE_ENV === 'test' && request.user) {
      return true;
    }
    let token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (!token) {
      token = extractTokenFromCookie(request);
    }

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const client = this.supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Authentication service unavailable');
    }

    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException(
        error?.message ?? 'Invalid or expired token',
      );
    }

    const emailFromProvider = user.email?.trim();
    const resolvedEmail =
      emailFromProvider && emailFromProvider.length > 0
        ? emailFromProvider
        : `${user.id}${ANONYMOUS_EMAIL_SUFFIX}`;

    const metadata = user.user_metadata;
    let nameFromMetadata: string | undefined;
    let avatarUrlFromMetadata: string | undefined;
    if (metadata !== null && typeof metadata === 'object') {
      if (typeof metadata.name === 'string') {
        nameFromMetadata = metadata.name;
      }
      if (typeof metadata.avatar_url === 'string') {
        avatarUrlFromMetadata = metadata.avatar_url;
      }
    }

    try {
      await this.usersService.upsertUser({
        id: user.id,
        email: resolvedEmail,
        name: nameFromMetadata,
        avatarUrl: avatarUrlFromMetadata,
      });
    } catch (syncErr) {
      this.logger.warn(
        'Failed to sync user during JWT guard',
        syncErr instanceof Error ? syncErr.message : String(syncErr),
      );
    }

    const roleClaim =
      'role' in user && typeof user.role === 'string' ? user.role : undefined;

    request.user = {
      sub: user.id,
      email: resolvedEmail,
      role: roleClaim,
      user_metadata: user.user_metadata as JwtPayload['user_metadata'],
      app_metadata: user.app_metadata as JwtPayload['app_metadata'],
    };

    return true;
  }
}
