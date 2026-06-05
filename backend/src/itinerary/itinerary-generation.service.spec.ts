import { ActivityType, Prisma } from '@prisma/client';
import { ItineraryGenerationService } from './itinerary-generation.service';
import { buildItineraryPrompt } from './prompts/generate-itinerary.prompt';
import { PrismaService } from '../prisma/prisma.service';
import { AttractionsService } from '../attractions/attractions.service';
import { WeatherService } from '../weather/weather.service';
import { AppConfigService } from '../config/config.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { GeneratedActivity, GeneratedDay, GeneratedItinerary } from './types';
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
  geocodeAddress: jest.fn().mockResolvedValue({ lat: 48.8566, lng: 2.3522 }),
  searchAttractions: jest.fn().mockResolvedValue([]),
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
            generalTips: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  content: 'Check local transportation options before arrival.',
                }),
                expect.objectContaining({
                  content: 'Keep digital copies of your travel documents.',
                }),
                expect.objectContaining({
                  content: 'Respect local customs and traditions.',
                }),
              ]),
            },
          }),
        }),
      );
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

  // =========================================================================
  // persistGeneratedItinerary - with days, activities, geocoding, groupId
  // =========================================================================

  describe('persistGeneratedItinerary with days and activities', () => {
    it('creates days, weather snapshots, and activities inside transaction', async () => {
      const tx = {
        itinerary: { create: jest.fn().mockResolvedValue({ id: 'itin-1' }) },
        itineraryTip: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
        itineraryDay: { create: jest.fn().mockResolvedValue({ id: 'day-1' }) },
        itineraryWeatherSnapshot: {
          create: jest.fn().mockResolvedValue({ id: 'weather-1' }),
        },
        itineraryActivity: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        groupItinerary: { create: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (txClient: unknown) => unknown) => cb(tx),
      );

      const generated: GeneratedItinerary = {
        days: [
          {
            day: 1,
            theme: 'Arrival',
            activities: [
              {
                // No coordinates, no placeId, and title doesn't match any attraction
                // So mapSingleDay will produce null lat/lng → geocodeAddress is called
                title: 'Unknown Venue',
                location: 'Some Unknown Street',
                duration: '1.5',
              } as unknown as GeneratedActivity,
            ],
            meals: [],
          },
        ],
        summary: { bestSeason: 'Summer', estimatedBudget: '$2000' },
        generalTips: ['Carry water'],
      };

      await service.persistGeneratedItinerary({
        userId: 'user-1',
        createItineraryDto: baseDto as unknown as CreateItineraryDto,
        generated,
        generationStart: Date.now() - 1000,
        weatherData: weatherData as unknown as WeatherData,
        attractions: attractions as unknown as FormattedPlace[],
        prompt: 'PROMPT',
        promptHash: 'hash',
      });

      expect(tx.itinerary.create).toHaveBeenCalled();
      // geocodeAddress called because mapped activity has null lat/lng
      expect(mockAttractionsService.geocodeAddress).toHaveBeenCalled();
    });

    it('skips geocoding when coordinates are already provided', async () => {
      mockAttractionsService.geocodeAddress.mockClear();
      const tx = {
        itinerary: { create: jest.fn().mockResolvedValue({ id: 'itin-1' }) },
        itineraryTip: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
        itineraryDay: { create: jest.fn().mockResolvedValue({ id: 'day-1' }) },
        itineraryWeatherSnapshot: {
          create: jest.fn().mockResolvedValue({ id: 'weather-1' }),
        },
        itineraryActivity: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (txClient: unknown) => unknown) => cb(tx),
      );

      const generated: GeneratedItinerary = {
        days: [
          {
            day: 1,
            theme: 'Arrival',
            activities: [
              {
                title: 'Eiffel Tower',
                location: 'Champ de Mars',
                duration: 2,
                // coordinates provided so mapSingleDay sets latitude/longitude
                coordinates: { lat: 48.8584, lng: 2.2945 },
              } as unknown as GeneratedActivity,
            ],
            meals: [],
          },
        ],
        summary: {},
        generalTips: [],
      };

      await service.persistGeneratedItinerary({
        userId: 'user-1',
        createItineraryDto: baseDto as unknown as CreateItineraryDto,
        generated,
        generationStart: Date.now() - 1000,
        weatherData: weatherData as unknown as WeatherData,
        attractions: [] as unknown as FormattedPlace[],
        prompt: 'PROMPT',
        promptHash: 'hash',
      });

      expect(tx.itinerary.create).toHaveBeenCalled();
      expect(mockAttractionsService.geocodeAddress).not.toHaveBeenCalled();
    });

    it('links to group when groupId is provided', async () => {
      const tx = {
        itinerary: { create: jest.fn().mockResolvedValue({ id: 'itin-1' }) },
        itineraryTip: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
        itineraryDay: { create: jest.fn() },
        itineraryWeatherSnapshot: { create: jest.fn() },
        itineraryActivity: { createMany: jest.fn() },
        groupItinerary: { create: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (txClient: unknown) => unknown) => cb(tx),
      );

      await service.persistGeneratedItinerary({
        userId: 'user-1',
        createItineraryDto: {
          ...baseDto,
          groupId: 'group-1',
        } as unknown as CreateItineraryDto,
        generated: { days: [], summary: {}, generalTips: [] },
        generationStart: Date.now() - 1000,
        weatherData: weatherData as unknown as WeatherData,
        attractions: [] as unknown as FormattedPlace[],
        prompt: 'PROMPT',
        promptHash: 'hash',
      });

      expect(tx.groupItinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupId: 'group-1',
            itineraryId: 'itin-1',
            addedById: 'user-1',
          }),
        }),
      );
    });

    it('creates activities even when weather.create is missing', async () => {
      const tx = {
        itinerary: { create: jest.fn().mockResolvedValue({ id: 'itin-1' }) },
        itineraryTip: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
        itineraryDay: { create: jest.fn().mockResolvedValue({ id: 'day-1' }) },
        itineraryWeatherSnapshot: { create: jest.fn() },
        itineraryActivity: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (txClient: unknown) => unknown) => cb(tx),
      );

      jest.spyOn(service, 'mapSingleDay').mockReturnValue({
        dayNumber: 1,
        date: new Date(),
        theme: 'Test',
        activities: {
          create: [
            {
              title: 'Act',
              activityType: ActivityType.ATTRACTION,
              sortOrder: 0,
              latitude: 1,
              longitude: 2,
            },
          ],
        },
        weather: undefined, // No weather create block
      } as unknown as Prisma.ItineraryDayCreateWithoutItineraryInput);

      await service.persistGeneratedItinerary({
        userId: 'user-1',
        createItineraryDto: baseDto as unknown as CreateItineraryDto,
        generated: {
          days: [{ day: 1, theme: 'Test', activities: [], meals: [] }],
          summary: {},
          generalTips: [],
        },
        generationStart: Date.now(),
        weatherData: weatherData as unknown as WeatherData,
        attractions: [] as unknown as FormattedPlace[],
        prompt: 'P',
        promptHash: 'h',
      });

      expect(tx.itinerary.create).toHaveBeenCalled();
      expect(tx.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            days: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  weather: undefined,
                }),
              ]),
            },
          }),
        }),
      );
    });
  });

  // =========================================================================
  // findAttractionForActivity (private method)
  // =========================================================================

  describe('findAttractionForActivity (via mapSingleDay)', () => {
    it('matches attraction by placeId when provided', () => {
      const day: GeneratedDay = {
        day: 1,
        theme: 'Test',
        activities: [
          {
            placeId: 'place-1',
            title: 'SomeOtherTitle',
            location: 'Nowhere',
          } as unknown as GeneratedActivity,
        ],
        meals: [],
      };

      const result = service.mapSingleDay(
        day,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        attractions as unknown as FormattedPlace[],
      );

      const acts =
        (result.activities as unknown as { create?: { placeId?: string }[] })
          ?.create ?? [];
      // Should find Eiffel Tower via placeId = 'place-1'
      expect(acts[0].placeId).toBe('place-1');
    });

    it('matches attraction by title fuzzy match when no placeId', () => {
      const day: GeneratedDay = {
        day: 1,
        theme: 'Test',
        activities: [
          {
            // No placeId; title partially matches 'Eiffel Tower'
            title: 'Eiffel',
            location: 'Unknown Location',
          } as unknown as GeneratedActivity,
        ],
        meals: [],
      };

      const result = service.mapSingleDay(
        day,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        attractions as unknown as FormattedPlace[],
      );

      const acts =
        (result.activities as unknown as { create?: { address?: string }[] })
          ?.create ?? [];
      // Activity own location takes precedence, but address comes from matched attraction
      expect(acts[0].address).toBe('Champ de Mars');
    });

    it('matches by location when placeId and title do not match', () => {
      const day: GeneratedDay = {
        day: 1,
        theme: 'Test',
        activities: [
          {
            title: 'Random Title',
            location: 'Champ de Mars', // matches Eiffel Tower address
          } as unknown as GeneratedActivity,
        ],
        meals: [],
      };

      const result = service.mapSingleDay(
        day,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        attractions as unknown as FormattedPlace[],
      );

      const acts =
        (result.activities as unknown as { create?: { address?: string }[] })
          ?.create ?? [];
      expect(acts[0].address).toBe('Champ de Mars');
    });
  });

  // =========================================================================
  // parseDuration (private method, tested via mapSingleDay)
  // =========================================================================

  describe('parseDuration (via mapSingleDay)', () => {
    it('parses string duration correctly', () => {
      const day: GeneratedDay = {
        day: 1,
        theme: 'Test',
        activities: [
          {
            title: 'Test',
            duration: '2.5', // 2.5 hours = 150 minutes
          } as unknown as GeneratedActivity,
        ],
        meals: [],
      };

      const result = service.mapSingleDay(
        day,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        [] as unknown as FormattedPlace[],
      );

      const acts =
        (
          result.activities as unknown as {
            create?: { durationMinutes?: number }[];
          }
        )?.create ?? [];
      expect(acts[0].durationMinutes).toBe(150);
    });

    it('falls back to 90 minutes for invalid/null duration', () => {
      const day: GeneratedDay = {
        day: 1,
        theme: 'Test',
        activities: [
          {
            title: 'Test',
            duration: 'not-a-number',
          } as unknown as GeneratedActivity,
        ],
        meals: [],
      };

      const result = service.mapSingleDay(
        day,
        baseDto.startDate,
        weatherData as unknown as WeatherData,
        [] as unknown as FormattedPlace[],
      );

      const acts =
        (
          result.activities as unknown as {
            create?: { durationMinutes?: number }[];
          }
        )?.create ?? [];
      expect(acts[0].durationMinutes).toBe(90);
    });
  });
});

// ---------------------------------------------------------------------------
// Supplementary: private helpers via type casting
// ---------------------------------------------------------------------------

describe('ItineraryGenerationService private helpers', () => {
  let service: ItineraryGenerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ItineraryGenerationService(
      mockPrisma as unknown as PrismaService,
      mockAttractionsService as unknown as AttractionsService,
      mockWeatherService as unknown as WeatherService,
      mockConfigService as unknown as AppConfigService,
    );
  });

  type ServicePrivates = {
    buildTravelTimeContext: (attractions: FormattedPlace[]) => string;
    calculateHaversineDistance: (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => number;
  };

  // =========================================================================
  // buildTravelTimeContext
  // =========================================================================

  describe('buildTravelTimeContext', () => {
    it('returns fallback when fewer than 2 attractions are provided', () => {
      const result = (
        service as unknown as ServicePrivates
      ).buildTravelTimeContext([]);
      expect(result).toBe('Not enough attractions for travel time matrix.');
    });

    it('returns fallback for a single attraction', () => {
      const result = (
        service as unknown as ServicePrivates
      ).buildTravelTimeContext([attractions[0]] as FormattedPlace[]);
      expect(result).toBe('Not enough attractions for travel time matrix.');
    });

    it('returns travel time lines for 2+ attractions', () => {
      const twoAttractions: FormattedPlace[] = [
        {
          id: 'a1',
          name: 'Place A',
          address: 'Addr A',
          description: 'D1',
          type: 't1',
          sourceType: 'mainstream',
          photos: [],
          rating: 4.0,
          userRatingsTotal: 100,
          location: { lat: 48.8566, lng: 2.3522 },
        },
        {
          id: 'a2',
          name: 'Place B',
          address: 'Addr B',
          description: 'D2',
          type: 't2',
          sourceType: 'niche',
          photos: [],
          rating: 3.5,
          userRatingsTotal: 50,
          location: { lat: 48.8606, lng: 2.3376 },
        },
      ];

      const result = (
        service as unknown as ServicePrivates
      ).buildTravelTimeContext(twoAttractions);
      expect(result).toContain('Place A -> Place B');
      expect(result).toContain('min');
      expect(result).toContain('km');
    });

    it('sorts by rating descending and slices to 8 for the matrix', () => {
      // Create 10 attractions with varying ratings
      const manyAttractions: FormattedPlace[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `p${i}`,
          name: `Place ${i}`,
          address: `Addr ${i}`,
          description: 'D',
          type: 't',
          sourceType: 'mainstream',
          photos: [],
          rating: i * 0.5,
          userRatingsTotal: i * 10,
          location: { lat: 48.8 + i * 0.01, lng: 2.3 + i * 0.01 },
        }),
      );

      const result = (
        service as unknown as ServicePrivates
      ).buildTravelTimeContext(manyAttractions);
      // At most 8 * 7 / 2 = 28 pair lines
      const lines = result.split('\n').filter((l) => l.length > 0);
      expect(lines.length).toBeLessThanOrEqual(28);
    });
  });

  // =========================================================================
  // calculateHaversineDistance
  // =========================================================================

  describe('calculateHaversineDistance', () => {
    it('returns 0 for identical coordinates', () => {
      const dist = (
        service as unknown as ServicePrivates
      ).calculateHaversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(dist).toBeCloseTo(0, 5);
    });

    it('returns correct approximate distance between Paris and London', () => {
      // Paris: 48.8566, 2.3522 — London: 51.5074, -0.1278
      // ~340 km
      const dist = (
        service as unknown as ServicePrivates
      ).calculateHaversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
      expect(dist).toBeGreaterThan(300);
      expect(dist).toBeLessThan(400);
    });

    it('is symmetric (a->b == b->a)', () => {
      const d1 = (
        service as unknown as ServicePrivates
      ).calculateHaversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
      const d2 = (
        service as unknown as ServicePrivates
      ).calculateHaversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
      expect(d1).toBeCloseTo(d2, 5);
    });
  });
});
