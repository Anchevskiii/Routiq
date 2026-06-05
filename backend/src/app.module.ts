import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AttractionsModule } from './attractions/attractions.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { ExportModule } from './export/export.module';
import { GeminiModule } from './gemini/gemini.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';
import { SupabaseModule } from './supabase/supabase.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    AppConfigModule,

    // Database
    PrismaModule,
    SupabaseModule,

    // Cron jobs
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
      {
        name: 'itinerary-generate',
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute per user
      },
      {
        name: 'avatar-upload',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'group-invite',
        ttl: 60000,
        limit: 10,
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
    MailModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
