import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/config.service';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getSupabaseJwtSecret(),
    });
  }

  /**
   * Validates the JWT payload.
   * This method also performs an "on-demand sync" to ensure the user exists 
   * in our public.users table.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // On-demand sync: Ensure user exists in our DB
    // This is a safety net in case the DB trigger fails or hasn't run yet.
    try {
      await this.usersService.upsertUser({
        id: payload.sub,
        email: payload.email,
        name: payload.user_metadata?.name,
        avatarUrl: payload.user_metadata?.avatar_url,
      });
    } catch (error) {
      // We log but don't fail here, unless it's a critical error.
      // If the user record exists, the app works. If it doesn't, 
      // some relations might fail later, but the user is authenticated.
      console.error('Failed to sync user during JWT validation:', error);
    }

    return payload;
  }
}
