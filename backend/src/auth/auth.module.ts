import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '../config/config.module';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, ConfigModule, UsersModule],
  providers: [JwtStrategy],
})
export class AuthModule {}
