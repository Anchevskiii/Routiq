import axios from 'axios';
import { withRetry } from '../common';
import { AppConfigService } from '../config/config.service';
import { WeatherService } from './weather.service';
import { WeatherData } from './types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../common', () => {
  const original = jest.requireActual('../common');
  return {
    ...original,
    withRetry: jest.fn().mockImplementation((fn) => fn()),
  };
});

describe('WeatherService', () => {
  let service: WeatherService;
  let mockConfigService: {
    getGoogleWeatherApiKey: jest.Mock;
    getGooglePlacesApiKey: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError.mockImplementation((err: unknown) => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'isAxiosError' in err &&
        (err as { isAxiosError: boolean }).isAxiosError === true
      );
    });
    mockConfigService = {
      getGoogleWeatherApiKey: jest.fn().mockReturnValue('fake-weather-key'),
      getGooglePlacesApiKey: jest.fn().mockReturnValue('fake-places-key'),
    };
    service = new WeatherService(
      mockConfigService as unknown as AppConfigService,
    );
  });

  describe('getForecast', () => {
    it('should return cached data if cached and within cache duration', async () => {
      const cachedData = {
        location: 'Paris',
        current: {
          temperature: 20,
          condition: 'Sunny',
          humidity: 50,
          windSpeed: 10,
        },
        forecast: [],
      } as WeatherData;

      service['cache'].set('Paris-2026-06-04-5', {
        data: cachedData,
        timestamp: Date.now(),
      });

      const result = await service.getForecast('Paris', '2026-06-04', 5);
      expect(result).toEqual(cachedData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch and return weather from Google API when cache is empty', async () => {
      // 1. Mock Geocoding API response
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        if (url.includes('currentConditions')) {
          return Promise.resolve({
            data: {
              temperature: { degrees: 22 },
              weatherCondition: { description: { text: 'Clear' } },
              relativeHumidity: 45,
              wind: { speed: { value: 12 } },
            },
          });
        }
        if (url.includes('forecast/days')) {
          return Promise.resolve({
            data: {
              forecastDays: [
                {
                  displayDate: { year: 2026, month: 6, day: 4 },
                  minTemperature: { degrees: 15 },
                  maxTemperature: { degrees: 25 },
                  daytimeForecast: {
                    weatherCondition: { description: { text: 'Clear' } },
                    relativeHumidity: 45,
                    wind: { speed: { value: 12 } },
                    precipitation: { probability: { percent: 10 } },
                  },
                },
              ],
            },
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      const result = await service.getForecast('Paris', '2026-06-04', 1);

      expect(result.location).toBe('Paris');
      expect(result.current.temperature).toBe(22);
      expect(result.forecast).toHaveLength(1);
      expect(result.forecast[0].date).toBe('2026-06-04');
      expect(result.forecast[0].temperature.max).toBe(25);
    });

    it('should fallback to mock weather if Geocoding status is not OK', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'ZERO_RESULTS',
              results: [],
            },
          });
        }
        return Promise.reject(new Error('Should not be called'));
      });

      const result = await service.getForecast('Unknown City', '2026-06-04', 3);
      expect(result.location).toBe('Unknown City');
      expect(result.forecast).toHaveLength(3);
    });

    it('should fallback to mock weather if Google API fails', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        return Promise.reject(new Error('Google weather API error'));
      });

      const result = await service.getForecast('Paris', '2026-06-04', 3);
      expect(result.location).toBe('Paris');
      expect(result.forecast).toHaveLength(3);
    });

    it('should fallback to mock weather if apiKey is not configured', async () => {
      mockConfigService.getGoogleWeatherApiKey.mockReturnValue(null);
      mockConfigService.getGooglePlacesApiKey.mockReturnValue(null);
      const noKeyService = new WeatherService(
        mockConfigService as unknown as AppConfigService,
      );

      const result = await noKeyService.getForecast('Paris', '2026-06-04', 3);
      expect(result.location).toBe('Paris');
      expect(result.forecast).toHaveLength(3);
    });

    it('should test shouldRetry function inside geocoding and currentConditions lookup', async () => {
      const mockGeocodeError429 = {
        isAxiosError: true,
        response: { status: 429 },
      };
      const mockGeocodeError400 = {
        isAxiosError: true,
        response: { status: 400 },
      };
      const mockNonAxiosError = new Error('generic');

      const mockedWithRetry = withRetry as jest.Mock;

      mockedAxios.get.mockResolvedValue({ data: { status: 'ZERO_RESULTS' } });
      await service.getForecast('Paris', '2026-06-04', 1);

      const geocodeOptions = mockedWithRetry.mock.calls[0][1];
      expect(geocodeOptions.shouldRetry(mockGeocodeError429)).toBe(true);
      expect(geocodeOptions.shouldRetry(mockGeocodeError400)).toBe(false);
      expect(geocodeOptions.shouldRetry(mockNonAxiosError)).toBe(true);
    });

    it('should test shouldRetry for currentConditions and forecast lookup', async () => {
      const mockedWithRetry = withRetry as jest.Mock;

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        return Promise.resolve({ data: {} });
      });

      await service.getForecast('Paris', '2026-06-04', 1);

      const currentConditionsOptions = mockedWithRetry.mock.calls[1][1];
      const forecastOptions = mockedWithRetry.mock.calls[2][1];

      const mockError500 = { isAxiosError: true, response: { status: 500 } };
      const mockError404 = { isAxiosError: true, response: { status: 404 } };

      expect(currentConditionsOptions.shouldRetry(mockError500)).toBe(true);
      expect(currentConditionsOptions.shouldRetry(mockError404)).toBe(false);
      expect(forecastOptions.shouldRetry(mockError500)).toBe(true);
      expect(forecastOptions.shouldRetry(mockError404)).toBe(false);
    });

    it('should fill missing days using fallback close match when requested days exceed API returned days', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        if (url.includes('currentConditions')) {
          return Promise.resolve({
            data: {
              temperature: { degrees: 22 },
              weatherCondition: { description: { text: 'Clear' } },
              relativeHumidity: 45,
              wind: { speed: { value: 12 } },
            },
          });
        }
        if (url.includes('forecast/days')) {
          return Promise.resolve({
            data: {
              forecastDays: [
                {
                  displayDate: { year: 2026, month: 6, day: 4 },
                  minTemperature: { degrees: 15 },
                  maxTemperature: { degrees: 25 },
                  daytimeForecast: {
                    weatherCondition: { description: { text: 'Clear' } },
                    relativeHumidity: 45,
                    wind: { speed: { value: 12 } },
                    precipitation: { probability: { percent: 10 } },
                  },
                },
              ],
            },
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      const result = await service.getForecast('Paris', '2026-06-04', 3);
      expect(result.forecast).toHaveLength(3);
      expect(result.forecast[1].date).toBe('2026-06-05');
      expect(result.forecast[2].date).toBe('2026-06-06');
    });

    it('should catch geocoding errors and log debug info', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Geocoding network error'));
      const result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.location).toBe('Paris');
      expect(result.forecast).toHaveLength(1);
    });

    it('should catch general errors inside getForecast and return mock data', async () => {
      jest
        .spyOn(
          service as unknown as { getCoordinates: () => Promise<unknown> },
          'getCoordinates',
        )
        .mockRejectedValue('Unstructured error string');
      const result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.location).toBe('Paris');
    });

    it('should catch general Error instances inside getForecast and return mock data', async () => {
      jest
        .spyOn(
          service as unknown as { getCoordinates: () => Promise<unknown> },
          'getCoordinates',
        )
        .mockRejectedValue(new Error('Structured error object'));
      const result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.location).toBe('Paris');
    });

    it('should handle non-Error instances in geocoding and Google forecast rejections', async () => {
      // Geocoding fails with non-Error
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.reject('Geocoding string error');
        }
        return Promise.resolve({ data: {} });
      });

      let result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.location).toBe('Paris');

      // Geocoding succeeds, but Google Weather API fails with non-Error
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        return Promise.reject('Google Weather string error');
      });

      result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.location).toBe('Paris');
    });

    it('should map google weather forecast using defaults when fields are missing', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        if (url.includes('currentConditions')) {
          return Promise.resolve({
            data: {}, // Missing all fields
          });
        }
        if (url.includes('forecast/days')) {
          return Promise.resolve({
            data: {
              forecastDays: [
                {
                  displayDate: { year: 2026, month: 6, day: 4 },
                  // Missing minTemperature, maxTemperature, daytimeForecast fields
                },
              ],
            },
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      const result = await service.getForecast('Paris', '2026-06-04', 1);
      expect(result.forecast[0].temperature.min).toBe(15);
      expect(result.forecast[0].temperature.max).toBe(25);
      expect(result.forecast[0].condition).toBe('Clear');
      expect(result.forecast[0].humidity).toBe(50);
      expect(result.forecast[0].windSpeed).toBe(0);
      expect(result.forecast[0].precipitation).toBe(0);
    });
  });

  describe('Cache actions', () => {
    it('should clear cache', () => {
      service['cache'].set('key1', {
        data: {} as WeatherData,
        timestamp: Date.now(),
      });
      expect(service.getCacheStats().size).toBe(1);

      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });

    it('should return cache stats', () => {
      service['cache'].set('key1', {
        data: {} as WeatherData,
        timestamp: Date.now(),
      });
      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toEqual(['key1']);
    });
  });

  // -------------------------------------------------------------------------
  // Missing API key coverage (line 65)
  // -------------------------------------------------------------------------

  describe('getForecast when Google Weather API key is not configured', () => {
    it('falls back to mock weather without calling weather API', async () => {
      const noKeyConfigService = {
        getGoogleWeatherApiKey: jest.fn().mockReturnValue(null),
        getGooglePlacesApiKey: jest.fn().mockReturnValue('fake-places-key'),
      };
      const noKeyService = new WeatherService(
        noKeyConfigService as unknown as AppConfigService,
      );

      // Geocoding mock to return valid coordinates
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                {
                  geometry: { location: { lat: 48.8566, lng: 2.3522 } },
                },
              ],
            },
          });
        }
        return Promise.reject(new Error('Should not be called'));
      });

      const result = await noKeyService.getForecast('Paris', '2026-06-04', 1);

      // Should return mock weather (fallback)
      expect(result.location).toBe('Paris');
      expect(result.forecast).toHaveLength(1);
      // The Google Weather endpoint should NOT have been called
      const weatherCallCount = mockedAxios.get.mock.calls.filter((args) =>
        (args[0] as string).includes('weather.googleapis.com/v1/weather'),
      ).length;
      expect(weatherCallCount).toBe(0);
    });

    it('should test shouldRetry logic of withRetry wrapper', async () => {
      service['cache'].clear();
      jest.mocked(withRetry).mockClear();
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        return Promise.reject(new Error('API Error'));
      });

      try {
        await service.getForecast('Paris', '2026-06-04', 5);
      } catch {
        // ignore
      }

      service['cache'].clear();

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('geocode')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              results: [
                { geometry: { location: { lat: 48.8566, lng: 2.3522 } } },
              ],
            },
          });
        }
        if (url.includes('currentConditions')) {
          return Promise.resolve({ data: {} });
        }
        return Promise.reject(new Error('API Error'));
      });

      try {
        await service.getForecast('Paris', '2026-06-04', 5);
      } catch {
        // ignore
      }

      const calls = jest.mocked(withRetry).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        const options = call[1];
        if (options && typeof options.shouldRetry === 'function') {
          expect(options.shouldRetry(new Error('Generic'))).toBe(true);

          const axiosErrNoRes = new Error('AxiosError') as unknown as {
            isAxiosError: boolean;
            response?: { status: number };
          };
          axiosErrNoRes.isAxiosError = true;
          expect(options.shouldRetry(axiosErrNoRes as unknown as Error)).toBe(
            true,
          );

          const axiosErr429 = new Error('AxiosError') as unknown as {
            isAxiosError: boolean;
            response?: { status: number };
          };
          axiosErr429.isAxiosError = true;
          axiosErr429.response = { status: 429 };
          expect(options.shouldRetry(axiosErr429 as unknown as Error)).toBe(
            true,
          );

          const axiosErr400 = new Error('AxiosError') as unknown as {
            isAxiosError: boolean;
            response?: { status: number };
          };
          axiosErr400.isAxiosError = true;
          axiosErr400.response = { status: 400 };
          expect(options.shouldRetry(axiosErr400 as unknown as Error)).toBe(
            false,
          );
        }
      }
    });
  });
});
