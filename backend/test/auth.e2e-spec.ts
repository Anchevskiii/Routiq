import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter, TransformInterceptor } from '../src/common';
import { ItineraryThrottlerGuard } from '../src/itinerary/guards/itinerary-throttler.guard';
import { APP_GUARD } from '@nestjs/core';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let supabaseMock: {
    getClient: jest.Mock;
  };

  beforeAll(async () => {
    supabaseMock = {
      getClient: jest.fn(),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .overrideGuard(ItineraryThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JwtAuthGuard pipeline', () => {
    it('/api/users/profile (GET) returns 401 when Authorization header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing bearer token');
    });

    it('/api/users/profile (GET) returns 401 when token is invalid or expired', async () => {
      supabaseMock.getClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth token has expired' },
          }),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Auth token has expired');
    });

    it('/api/health (GET) is Public and returns 200 without auth header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });
});
