import { TravelType } from '@prisma/client';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { AttractionsService } from './attractions.service';
import { FormattedPlace } from './types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../common', () => {
  const original = jest.requireActual('../common');
  return {
    ...original,
    withRetry: jest.fn().mockImplementation((fn) => fn()),
  };
});

describe('AttractionsService', () => {
  let service: AttractionsService;
  let mockConfigService: {
    getGooglePlacesApiKey: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      getGooglePlacesApiKey: jest.fn().mockReturnValue('fake-key'),
    };
    service = new AttractionsService(
      mockConfigService as unknown as AppConfigService,
    );
  });

  describe('getApiKeyOrThrow', () => {
    it('should throw ServiceUnavailableException if apiKey is not configured', () => {
      mockConfigService.getGooglePlacesApiKey.mockReturnValue(null);
      const invalidService = new AttractionsService(
        mockConfigService as unknown as AppConfigService,
      );
      expect(() => invalidService['getApiKeyOrThrow']()).toThrow(
        'Google Places API is not configured',
      );
    });

    it('should strip quotes if they exist in apiKey', () => {
      mockConfigService.getGooglePlacesApiKey.mockReturnValue('"my-key"');
      const serviceWithQuotes = new AttractionsService(
        mockConfigService as unknown as AppConfigService,
      );
      expect(serviceWithQuotes['getApiKeyOrThrow']()).toBe('my-key');
    });
  });

  describe('searchLegacy', () => {
    it('should return cached data if cached and within 24 hours', async () => {
      const cachedData = [
        { id: 'cached-id', name: 'Cached Place' },
      ] as unknown as FormattedPlace[];
      service['searchCache'].set('query-radius-', {
        data: cachedData,
        timestamp: Date.now(),
      });

      const result = await service['searchLegacy']('query-radius');
      expect(result).toEqual(cachedData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should perform legacy search when not cached', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              place_id: 'place1',
              name: 'Place One',
              formatted_address: '123 Main St',
              geometry: { location: { lat: 10, lng: 20 } },
              types: ['museum'],
              rating: 4.5,
              user_ratings_total: 100,
            },
          ],
        },
      });

      const result = await service['searchLegacy']('Paris');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('place1');
      expect(result[0].name).toBe('Place One');
      expect(result[0].rating).toBe(4.5);
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should return empty array if API status is not OK or ZERO_RESULTS', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'INVALID_REQUEST',
          results: [],
        },
      });

      const result = await service['searchLegacy']('Paris');
      expect(result).toEqual([]);
    });

    it('should return empty array if search fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      const result = await service['searchLegacy']('Paris');
      expect(result).toEqual([]);
    });
  });

  describe('getCuratedPlaces', () => {
    it('should curate mainstream, niche, and dining places and sort them', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              place_id: 'p1',
              name: 'Place 1',
              rating: 5.0,
              user_ratings_total: 1000,
            },
          ],
        },
      });

      const result = await service.getCuratedPlaces(
        'Paris',
        TravelType.CULTURAL,
        1,
      );
      expect(result.length).toBeGreaterThan(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAttractionDetails', () => {
    it('should retrieve and format attraction details', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'OK',
          result: {
            place_id: 'details-id',
            name: 'Detailed Place',
            formatted_address: 'Address Details',
            types: ['park'],
            rating: 4.8,
            user_ratings_total: 200,
          },
        },
      });

      const result = await service.getAttractionDetails('details-id');
      expect(result.id).toBe('details-id');
      expect(result.name).toBe('Detailed Place');
    });

    it('should throw ServiceUnavailableException if details fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API failed'));
      await expect(service.getAttractionDetails('id')).rejects.toThrow(
        'Failed to get attraction details',
      );
    });
  });

  describe('getAlternatives', () => {
    it('should get alternative attractions', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('details')) {
          return Promise.resolve({
            data: {
              status: 'OK',
              result: {
                place_id: 'p1',
                name: 'Eiffel Tower',
              },
            },
          });
        }
        return Promise.resolve({
          data: {
            status: 'OK',
            results: [
              {
                place_id: 'p1',
                name: 'Eiffel Tower',
              },
              {
                place_id: 'p2',
                name: 'Louvre',
              },
            ],
          },
        });
      });

      const result = await service.getAlternatives('p1', 'Paris');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p2');
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode an address and return coordinates', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              geometry: {
                location: {
                  lat: 48.8566,
                  lng: 2.3522,
                },
              },
            },
          ],
        },
      });

      const result = await service.geocodeAddress('Paris');
      expect(result).toEqual({ lat: 48.8566, lng: 2.3522 });
    });

    it('should return null if status is not OK', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'ZERO_RESULTS',
          results: [],
        },
      });

      const result = await service.geocodeAddress('Paris');
      expect(result).toBeNull();
    });

    it('should return null if geocoding throws an error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      const result = await service.geocodeAddress('Paris');
      expect(result).toBeNull();
    });
  });
});
