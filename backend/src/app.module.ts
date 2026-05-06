import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AttractionsModule } from './attractions/attractions.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { ExportModule } from './export/export.module';
import { GeminiModule } from './gemini/gemini.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppConfigModule,

    // Database
    PrismaModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    ItineraryModule,
    GeminiModule,
    AttractionsModule,
    WeatherModule,
    GroupsModule,
    ExportModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
