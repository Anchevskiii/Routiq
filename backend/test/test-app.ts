import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { AppModule } from '../src/app.module';
import { AttractionsService } from '../src/attractions/attractions.service';
import { FormattedPlace } from '../src/attractions/types';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { GeminiService, GeminiStreamEvent } from '../src/gemini/gemini.service';
import { ItineraryThrottlerGuard } from '../src/itinerary/guards/itinerary-throttler.guard';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WeatherService } from '../src/weather/weather.service';
import { WeatherData } from '../src/weather/types';
import { AllExceptionsFilter, TransformInterceptor } from '../src/common';

export interface TestAuthUser {
  sub: string;
  email: string;
}

class FakeGeminiService {
  streamGenerateObservable(): Observable<GeminiStreamEvent> {
    const dayJson = {
      day: 1,
      theme: 'Day 1: Highlights',
      activities: [
        {
          title: 'Old Town Walk',
          type: 'attraction',
        },
      ],
    };

    const events: GeminiStreamEvent[] = [
      { type: 'chunk', content: JSON.stringify(dayJson) },
      { type: 'complete', data: [dayJson] },
    ];

    return of(...events);
  }

  async streamGenerate(): Promise<unknown> {
    return [
      {
        day: 1,
        theme: 'Day 1: Highlights',
        activities: [
          {
            title: 'Old Town Walk',
            type: 'attraction',
          },
        ],
      },
    ];
  }
}

const fakeAttractionsService = {
  async getCuratedPlaces(): Promise<FormattedPlace[]> {
    return [
      {
        id: 'place_1',
        name: 'Central Plaza',
        description: 'Historic plaza in the city center.',
        location: { lat: 48.8566, lng: 2.3522 },
        address: '1 Plaza St',
        type: 'tourist_attraction',
        rating: 4.6,
        userRatingsTotal: 1200,
        photos: [],
        sourceType: 'mainstream',
      },
    ];
  },
  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    return { lat: 48.8566, lng: 2.3522 };
  },
};

const fakeWeatherService = {
  async getForecast(
    destination: string,
    startDate: string,
    days: number,
  ): Promise<WeatherData> {
    const baseDate = new Date(startDate);
    baseDate.setUTCHours(0, 0, 0, 0);

    const forecast = Array.from({ length: days }, (_unused, index) => {
      const date = new Date(baseDate);
      date.setUTCDate(baseDate.getUTCDate() + index);
      return {
        date: date.toISOString().split('T')[0],
        temperature: { min: 12, max: 22 },
        condition: 'Clear',
        humidity: 45,
        windSpeed: 8,
        precipitation: 0,
      };
    });

    return {
      location: destination,
      current: {
        temperature: 18,
        condition: 'Clear',
        humidity: 45,
        windSpeed: 8,
      },
      forecast,
    };
  },
};

const fakeMailService = {
  async sendGroupInvitation(): Promise<void> {
    return undefined;
  },
};

export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  setCurrentUser: (user: TestAuthUser) => void;
}

export async function createTestApp(): Promise<TestAppContext> {
  let currentUser: TestAuthUser = {
    sub: 'test-user',
    email: 'test@example.com',
  };

  const testAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = currentUser;
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
    .overrideGuard(ItineraryThrottlerGuard)
    .useValue({ canActivate: () => true })
    .overrideProvider(GeminiService)
    .useValue(new FakeGeminiService())
    .overrideProvider(AttractionsService)
    .useValue(fakeAttractionsService)
    .overrideProvider(WeatherService)
    .useValue(fakeWeatherService)
    .overrideProvider(MailService)
    .useValue(fakeMailService)
    .compile();

  const app = moduleFixture.createNestApplication();
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
  app.use(
    (
      req: Request & { user?: TestAuthUser },
      _res: Response,
      next: NextFunction,
    ) => {
      req.user = currentUser;
      next();
    },
  );
  app.setGlobalPrefix('api');
  await app.init();

  return {
    app,
    prisma: moduleFixture.get(PrismaService),
    setCurrentUser: (user: TestAuthUser) => {
      currentUser = user;
    },
  };
}
