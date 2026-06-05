import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter, TransformInterceptor } from '../src/common';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { GeminiService } from '../src/gemini/gemini.service';
import { AttractionsService } from '../src/attractions/attractions.service';
import { WeatherService } from '../src/weather/weather.service';
import { MailService } from '../src/mail/mail.service';
import { APP_GUARD } from '@nestjs/core';
import { TravelType } from '@prisma/client';
import { createTestApp, TestAppContext } from './test-app';
import { randomUUID } from 'crypto';

describe('Global Pipelines (e2e)', () => {
  let app: INestApplication;
  let testAppCtx: TestAppContext;

  beforeAll(async () => {
    testAppCtx = await createTestApp();
    app = testAppCtx.app;
    // Set a valid UUID for the mock user sub to prevent Postgres UUID parse crashes!
    testAppCtx.setCurrentUser({
      sub: randomUUID(),
      email: 'test@example.com',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('TransformInterceptor & AllExceptionsFilter wrapping', () => {
    it('wraps successful GET requests in a success envelope', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          service: 'routiq-backend',
        }),
      });
    });

    it('wraps client errors (404) in an error envelope', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/itinerary/00000000-0000-0000-0000-000000000000') // Nonexistent UUID
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOTFOUND',
          message: 'Itinerary not found',
          statusCode: 404,
        },
      });
    });
  });

  describe('Itinerary Generation Rate Limiting (Throttler)', () => {
    let rateApp: INestApplication;

    beforeAll(async () => {
      // Build a dedicated app instance where the ItineraryThrottlerGuard is NOT overridden
      const currentUser = { sub: randomUUID(), email: 'limit@example.com' };
      const testAuthGuard = {
        canActivate: () => {
          return true;
        },
      };

      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(testAuthGuard)
        .overrideProvider(APP_GUARD)
        .useValue(testAuthGuard)
        .overrideProvider(GeminiService)
        .useValue({
          generateStream: () => ({
            subscribe: (obs: { complete: () => void }) => obs.complete(),
          }),
          streamGenerate: async () => [],
        })
        .overrideProvider(AttractionsService)
        .useValue({ getCuratedPlaces: async () => [] })
        .overrideProvider(WeatherService)
        .useValue({ getForecast: async () => ({}) })
        .overrideProvider(MailService)
        .useValue({ sendGroupInvitation: async () => undefined })
        .compile();

      rateApp = moduleFixture.createNestApplication();
      rateApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      rateApp.useGlobalFilters(new AllExceptionsFilter());
      rateApp.useGlobalInterceptors(new TransformInterceptor());
      rateApp.use(cookieParser());
      // Replicate the express middleware that registers req.user to satisfy JwtAuthGuard testing logic
      rateApp.use(
        (
          req: Request & { user?: typeof currentUser },
          _res: Response,
          next: NextFunction,
        ) => {
          req.user = currentUser;
          next();
        },
      );
      rateApp.setGlobalPrefix('api');

      await rateApp.init();
    });

    afterAll(async () => {
      await rateApp.close();
    });

    it('allows 5 generation requests but throttles the 6th with 429', async () => {
      const payload = {
        destination: 'Vienna',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-03T00:00:00.000Z',
        days: 2,
        travelType: TravelType.CULTURAL,
      };

      // Fire 5 requests (should succeed)
      for (let i = 0; i < 5; i++) {
        await request(rateApp.getHttpServer())
          .post('/api/itinerary/generate')
          .send(payload)
          .expect(200);
      }

      // Fire the 6th request (should return 429)
      const response = await request(rateApp.getHttpServer())
        .post('/api/itinerary/generate')
        .send(payload)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('THROTTLER');
      expect(response.body.error.message).toBe(
        'ThrottlerException: Too Many Requests',
      );
    });
  });
});
