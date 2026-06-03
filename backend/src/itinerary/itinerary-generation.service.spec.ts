import { ActivityType } from '@prisma/client';
import { ItineraryGenerationService } from './itinerary-generation.service';
import { buildItineraryPrompt } from './prompts/generate-itinerary.prompt';
import { PrismaService } from '../prisma/prisma.service';
import { AttractionsService } from '../attractions/attractions.service';
import { WeatherService } from '../weather/weather.service';
import { AppConfigService } from '../config/config.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { GeneratedDay } from './types';
import { WeatherData } from '../weather/types';
import { FormattedPlace } from '../attractions/types';

jest.mock('./prompts/generate-itinerary.prompt', () => ({
  buildItineraryPrompt: jest.fn(),
}));

const mockPrisma = {
  $transaction: jest.fn(),
};

const mockAttractionsService = {
  getCuratedPlaces: jest.fn(),
};

const mockWeatherService = {
  getForecast: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const baseDto = {
  destination: 'Paris, France',
  startDate: new Date('2024-06-01T00:00:00.000Z'),
  endDate: new Date('2024-06-07T00:00:00.000Z'),
  days: 7,
  travelType: 'CULTURAL',
};

const weatherData = {
  location: 'Paris, France',
  current: {
    condition: 'Sunny',
    temperature: 20,
    humidity: 55,
    windSpeed: 8,
  },
  forecast: [
    {
      date: '2024-06-01',
      condition: 'Sunny',
      temperature: { min: 15, max: 25 },
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
    },
  ],
};

const attractions = [
  {
    id: 'place-1',
    name: 'Eiffel Tower',
    address: 'Champ de Mars',
    description: 'Landmark',
    type: 'landmark',
    photos: [],
    rating: 4.8,
    userRatingsTotal: 1000,
    location: { lat: 48.8584, lng: 2.2945 },
  },
];

function buildService(): ItineraryGenerationService {
  return new ItineraryGenerationService(
    mockPrisma as unknown as PrismaService,
    mockAttractionsService as unknown as AttractionsService,
    mockWeatherService as unknown as WeatherService,
    mockConfigService as unknown as AppConfigService,
  );
}

describe('ItineraryGenerationService', () => {
  let service: ItineraryGenerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();
  });

  describe('prepareGenerationData', () => {
    it('fetches weather and attractions and builds the prompt', async () => {
      mockWeatherService.getForecast.mockResolvedValue(weatherData);
      mockAttractionsService.getCuratedPlaces.mockResolvedValue(attractions);
      (buildItineraryPrompt as jest.Mock).mockReturnValue('PROMPT');

      const result = await service.prepareGenerationData(
        baseDto as unknown as CreateItineraryDto,
      );

      expect(mockWeatherService.getForecast).toHaveBeenCalledWith(
        baseDto.destination,
        baseDto.startDate.toISOString(),
        baseDto.days,
      );
      expect(mockAttractionsService.getCuratedPlaces).toHaveBeenCalledWith(
        baseDto.destination,
        baseDto.travelType,
        baseDto.days,
      );
      expect(buildItineraryPrompt).toHaveBeenCalledWith({
        destination: baseDto.destination,
        startDate: baseDto.startDate.toISOString(),
        endDate: baseDto.endDate.toISOString(),
        days: baseDto.days,
        travelType: baseDto.travelType,
        weatherData,
        attractions,
        travelTimeContext: '',
      });
      expect(result).toEqual({
        generationStart: expect.any(Number),
        weatherData,
        attractions,
        prompt: 'PROMPT',
      });
    });
  });

  describe('persistGeneratedItinerary', () => {
    it('uses default summary and tips when missing', async () => {
      const tx = {
        itinerary: { create: jest.fn().mockResolvedValue({ id: 'itin-1' }) },
        itineraryTip: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
        itineraryDay: { create: jest.fn().mockResolvedValue({ id: 'day-1' }) },
        itineraryWeatherSnapshot: {
          create: jest.fn().mockResolvedValue({ id: 'weather-1' }),
        },
        itineraryActivity: {
          createMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (txClient: unknown) => unknown) => cb(tx),
      );

      await service.persistGeneratedItinerary({
        userId: 'user-1',
        createItineraryDto: baseDto as unknown as CreateItineraryDto,
        generated: { days: [] },
        generationStart: Date.now() - 1000,
        weatherData: weatherData as unknown as WeatherData,
        attractions: attractions as unknown as FormattedPlace[],
        prompt: 'PROMPT',
        promptHash: 'hash',
      });

      expect(tx.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            bestSeason: 'Varies by region',
            estimatedBudget: 'Contact local guides for pricing',
            aiModel: 'gemini-2.5-flash',
            aiPromptHash: 'hash',
            generatedAt: expect.any(Date),
            generationTimeMs: expect.any(Number),
          }),
        }),
      );

      expect(tx.itineraryTip.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
        }),
      );

      const createManyArg = tx.itineraryTip.createMany.mock.calls[0][0];
      expect(createManyArg.data).toHaveLength(3);
    });
  });

  describe('mapSingleDay', () => {
    it('maps activities and meals with correct types and fallbacks', () => {
      const day = {
        day: 1,
        activities: [
          {
            title: 'Visit Eiffel Tower',
            location: 'Champ de Mars',
            duration: '1.5',
            placeId: 'place-1',
            coordinates: { lat: 48.8584, lng: 2.2945 },
          },
        ],
        meals: [
          {
            type: 'LUNCH',
            recommendation: 'Cafe de Flore',
            location: 'Saint-Germain',
            mealType: 'LUNCH',
          },
        ],
        weather: { condition: 'Cloudy', recommendations: 'Bring a jacket' },
      };

      const result = service.mapSingleDay(
        day as unknown as GeneratedDay,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        attractions as unknown as FormattedPlace[],
      );

      const activities =
        (
          result.activities as unknown as {
            create?: { activityType: ActivityType; durationMinutes: number }[];
          }
        )?.create ?? [];
      const weather =
        (
          result.weather as unknown as {
            create?: { condition?: string; recommendation?: string };
          }
        )?.create ?? {};

      expect(result.dayNumber).toBe(1);
      expect(result.theme).toBe('Day 1: Exploration');
      expect(activities).toHaveLength(2);
      expect(activities[0].activityType).toBe(ActivityType.ATTRACTION);
      expect(activities[0].durationMinutes).toBe(90);
      expect(activities[1].activityType).toBe(ActivityType.MEAL);
      expect(weather.condition).toBe('Sunny');
      expect(weather.recommendation).toBe('Bring a jacket');
    });
  });

  describe('mapDaysForNestedWrite', () => {
    it('maps each day via mapSingleDay', () => {
      const spy = jest.spyOn(service, 'mapSingleDay');
      const days = [{ day: 1 }, { day: 2 }];

      const result = service.mapDaysForNestedWrite(
        days as unknown as GeneratedDay[],
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        attractions as unknown as FormattedPlace[],
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
