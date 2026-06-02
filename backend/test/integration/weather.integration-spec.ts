import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { WeatherService } from '../../src/weather/weather.service';
import { AppConfigService } from '../../src/config/config.service';

interface PrivateWeatherService {
  getCoordinates: (
    destination: string,
  ) => Promise<{ lat: number; lng: number }>;
  getForecastWithGoogle: (
    lat: number,
    lng: number,
    days: number,
    destination: string,
    startDate: string,
  ) => Promise<unknown>;
  cache: Map<string, unknown>;
}

describe('WeatherService Caching (integration)', () => {
  let weatherService: WeatherService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
      providers: [
        WeatherService,
        {
          provide: AppConfigService,
          useValue: {
            getGoogleWeatherApiKey: () => 'fake-key',
            get: () => undefined,
          },
        },
      ],
    }).compile();

    weatherService = moduleRef.get(WeatherService);
  });

  beforeEach(() => {
    weatherService.clearCache();
    jest.clearAllMocks(); // Clear mock call tracking between test runs!
  });

  describe('Forecast Caching & TTL', () => {
    it('returns cached data and does not call getCoordinates if within 1 hour', async () => {
      const privateService = weatherService as unknown as PrivateWeatherService;

      const getCoordinatesSpy = jest
        .spyOn(privateService, 'getCoordinates')
        .mockResolvedValue({ lat: 46.0569, lng: 14.5058 }); // Ljubljana

      const getForecastWithGoogleSpy = jest
        .spyOn(privateService, 'getForecastWithGoogle')
        .mockResolvedValue({
          location: 'Ljubljana',
          current: {
            temperature: 20,
            condition: 'Sunny',
            humidity: 50,
            windSpeed: 5,
          },
          forecast: [],
        });

      // 1. Initial call (empty cache)
      const data1 = await weatherService.getForecast(
        'Ljubljana',
        '2026-06-01',
        3,
      );
      expect(data1.location).toBe('Ljubljana');
      expect(getCoordinatesSpy).toHaveBeenCalledTimes(1);
      expect(getForecastWithGoogleSpy).toHaveBeenCalledTimes(1);

      // 2. Second call within TTL (cache hit)
      const data2 = await weatherService.getForecast(
        'Ljubljana',
        '2026-06-01',
        3,
      );
      expect(data2.location).toBe('Ljubljana');
      // Number of API/Coordinate calls should still be 1!
      expect(getCoordinatesSpy).toHaveBeenCalledTimes(1);
      expect(getForecastWithGoogleSpy).toHaveBeenCalledTimes(1);
      expect(weatherService.getCacheStats().size).toBe(1);
    });

    it('evicts cached data and calls API again if cache duration is exceeded', async () => {
      const privateService = weatherService as unknown as PrivateWeatherService;

      const getCoordinatesSpy = jest
        .spyOn(privateService, 'getCoordinates')
        .mockResolvedValue({ lat: 46.0569, lng: 14.5058 });

      const getForecastWithGoogleSpy = jest
        .spyOn(privateService, 'getForecastWithGoogle')
        .mockResolvedValue({
          location: 'Ljubljana',
          current: {
            temperature: 20,
            condition: 'Sunny',
            humidity: 50,
            windSpeed: 5,
          },
          forecast: [],
        });

      // Seed the cache with an expired timestamp (2 hours ago)
      const cacheKey = 'Ljubljana-2026-06-01-3';
      privateService.cache.set(cacheKey, {
        data: {
          location: 'Ljubljana',
          current: {
            temperature: 10,
            condition: 'Rainy',
            humidity: 90,
            windSpeed: 15,
          },
          forecast: [],
        },
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      });

      // Call service
      const data = await weatherService.getForecast(
        'Ljubljana',
        '2026-06-01',
        3,
      );
      expect(data.current.condition).toBe('Sunny'); // Fetched fresh Sunny data instead of old Rainy data!
      expect(getCoordinatesSpy).toHaveBeenCalledTimes(1);
      expect(getForecastWithGoogleSpy).toHaveBeenCalledTimes(1);
    });
  });
});
