import axios from 'axios';
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
});
