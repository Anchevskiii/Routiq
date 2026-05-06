import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [JwtStrategy],
})
export class AuthModule {}
