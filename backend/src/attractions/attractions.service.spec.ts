import { TravelType } from '@prisma/client';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { AttractionsService } from './attractions.service';
import { FormattedPlace } from './types';
import { withRetry } from '../common';

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
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
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

    it('should handle shouldRetry logic on searchLegacy error', async () => {
      const mockWithRetry = withRetry as unknown as jest.Mock;
      mockWithRetry.mockClear();

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      await service['searchLegacy']('Paris');

      const configObj = mockWithRetry.mock.calls[0][1];
      expect(configObj.shouldRetry(new Error('Normal error'))).toBe(true);

      const axiosError = { isAxiosError: true, response: { status: 429 } };
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      expect(configObj.shouldRetry(axiosError)).toBe(true);

      const nonRetryError = { isAxiosError: true, response: { status: 400 } };
      expect(configObj.shouldRetry(nonRetryError)).toBe(false);
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

    it('should throw ServiceUnavailableException if API status is not OK', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'INVALID_REQUEST',
        },
      });
      await expect(service.getAttractionDetails('id')).rejects.toThrow(
        'Failed to get attraction details: API status: INVALID_REQUEST',
      );
    });

    it('should handle shouldRetry logic on getAttractionDetails error', async () => {
      const mockWithRetry = withRetry as unknown as jest.Mock;
      mockWithRetry.mockClear();

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      try {
        await service.getAttractionDetails('id');
      } catch {}

      const configObj = mockWithRetry.mock.calls[0][1];
      expect(configObj.shouldRetry(new Error('Normal error'))).toBe(true);

      const axiosError = { isAxiosError: true, response: { status: 429 } };
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      expect(configObj.shouldRetry(axiosError)).toBe(true);

      const nonRetryError = { isAxiosError: true, response: { status: 400 } };
      expect(configObj.shouldRetry(nonRetryError)).toBe(false);
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

    it('should throw ServiceUnavailableException if call throws an error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      await expect(service.getAlternatives('p1', 'Paris')).rejects.toThrow(
        'Failed to get alternatives',
      );
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

    it('should handle shouldRetry logic on geocodeAddress error', async () => {
      const mockWithRetry = withRetry as unknown as jest.Mock;
      mockWithRetry.mockClear();

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      await service.geocodeAddress('Paris');

      const configObj = mockWithRetry.mock.calls[0][1];
      expect(configObj.shouldRetry(new Error('Normal error'))).toBe(true);

      const axiosError = { isAxiosError: true, response: { status: 429 } };
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      expect(configObj.shouldRetry(axiosError)).toBe(true);

      const nonRetryError = { isAxiosError: true, response: { status: 400 } };
      expect(configObj.shouldRetry(nonRetryError)).toBe(false);
    });
  });

  describe('Helper private methods', () => {
    it('calculateDistanceMeters should calculate correct distance', () => {
      const dist = service['calculateDistanceMeters'](
        48.8566,
        2.3522,
        48.8584,
        2.2945,
      ); // Paris center to Eiffel Tower
      expect(dist).toBeGreaterThan(4000);
      expect(dist).toBeLessThan(5000);
    });

    it('getPlaceCategory should categorize correctly based on type or name', () => {
      const p1 = {
        name: 'Eiffel Tower',
        type: 'museum',
        sourceType: 'mainstream',
      } as unknown as FormattedPlace;
      expect(service['getPlaceCategory'](p1)).toBe('sightseeing');

      const p2 = {
        name: 'Nice Bistro',
        type: 'restaurant',
        sourceType: 'dining',
      } as unknown as FormattedPlace;
      expect(service['getPlaceCategory'](p2)).toBe('dining');

      const p2b = {
        name: 'Nice Food',
        type: 'restaurant',
        sourceType: 'mainstream',
      } as unknown as FormattedPlace;
      expect(service['getPlaceCategory'](p2b)).toBe('dining');

      const p3 = {
        name: 'Hyde Park',
        type: 'park',
        sourceType: 'mainstream',
      } as unknown as FormattedPlace;
      expect(service['getPlaceCategory'](p3)).toBe('outdoors');

      const p4 = {
        name: 'Random',
        type: 'other',
        sourceType: 'niche',
      } as unknown as FormattedPlace;
      expect(service['getPlaceCategory'](p4)).toBe('other');
    });

    it('areNamesSimilar should return true for highly similar names', () => {
      // "Eiffel Tower" and "Eiffel Tower Paris" has Jaccard similarity 2/3 = 0.67 (> 0.55)
      expect(
        service['areNamesSimilar']('Eiffel Tower Paris', 'Eiffel Tower'),
      ).toBe(true);
      // "Notre Dame Cathedral" and "Notre Dame" has Jaccard similarity 2/2 = 1.0 (> 0.55)
      expect(
        service['areNamesSimilar']('Notre Dame Cathedral', 'Notre Dame'),
      ).toBe(true);
      expect(service['areNamesSimilar']('Notre Dame', 'Eiffel Tower')).toBe(
        false,
      );
    });

    it('isUtilityPlace should return true for utility names', () => {
      const p1 = { name: 'Metro Station ATM' } as unknown as FormattedPlace;
      expect(service['isUtilityPlace'](p1)).toBe(true);

      const p2 = { name: 'Eiffel Tower' } as unknown as FormattedPlace;
      expect(service['isUtilityPlace'](p2)).toBe(false);
    });

    it('isLowQuality should flag low ratings or reviews', () => {
      const p1 = {
        rating: 2.5,
        userRatingsTotal: 10,
      } as unknown as FormattedPlace;
      expect(service['isLowQuality'](p1)).toBe(true);

      const p2 = {
        rating: 4.5,
        userRatingsTotal: 1,
      } as unknown as FormattedPlace;
      expect(service['isLowQuality'](p2)).toBe(true);

      const p3 = {
        rating: 4.5,
        userRatingsTotal: 100,
      } as unknown as FormattedPlace;
      expect(service['isLowQuality'](p3)).toBe(false);
    });
  });

  describe('getCuratedPlaces pruning', () => {
    it('should prune duplicates and similar places', async () => {
      const mainstream = [
        {
          place_id: 'm1',
          name: 'Eiffel Tower',
          rating: 4.8,
          user_ratings_total: 1000,
          geometry: { location: { lat: 48.8584, lng: 2.2945 } },
          types: ['tourist_attraction'],
        },
        {
          place_id: 'm2',
          name: 'Eiffel Tower Paris', // similar name and close distance (<30m)
          rating: 4.7,
          user_ratings_total: 800,
          geometry: { location: { lat: 48.8585, lng: 2.2946 } },
          types: ['tourist_attraction'],
        },
        {
          place_id: 'm3',
          name: 'Public Restroom ATM', // utility
          rating: 4.0,
          user_ratings_total: 10,
          geometry: { location: { lat: 48.858, lng: 2.294 } },
          types: ['establishment'],
        },
        {
          place_id: 'm4',
          name: 'Eiffel Tower Tour', // similar name and distance ~100m (>30m and <150m)
          rating: 4.6,
          user_ratings_total: 700,
          geometry: { location: { lat: 48.8593, lng: 2.2945 } },
          types: ['tourist_attraction'],
        },
      ];

      mockedAxios.get.mockImplementation((url: string) => {
        if (
          url.includes('query=restaurant') ||
          url.includes('type=restaurant')
        ) {
          return Promise.resolve({ data: { status: 'OK', results: [] } });
        }
        return Promise.resolve({ data: { status: 'OK', results: mainstream } });
      });

      const result = await service.getCuratedPlaces(
        'Paris',
        TravelType.CULTURAL,
        1,
      );
      // Eiffel Tower Paris and Eiffel Tower Tour should be pruned, and Public Restroom ATM should be filtered out
      expect(result.some((p) => p.id === 'm2')).toBe(false);
      expect(result.some((p) => p.id === 'm3')).toBe(false);
      expect(result.some((p) => p.id === 'm4')).toBe(false);
      expect(result.some((p) => p.id === 'm1')).toBe(true);
    });
  });

  describe('getPlaceTypesByTravelType', () => {
    it('should return correct place types for each travel type', () => {
      expect(service['getPlaceTypesByTravelType'](TravelType.CULTURAL)).toEqual(
        ['museum', 'art_gallery', 'place_of_worship', 'church', 'castle'],
      );
      expect(
        service['getPlaceTypesByTravelType'](TravelType.GASTRONOMIC),
      ).toEqual(['restaurant', 'cafe', 'food', 'bakery']);
      expect(
        service['getPlaceTypesByTravelType'](TravelType.ADVENTURE),
      ).toEqual(['amusement_park', 'aquarium', 'zoo', 'park']);
      expect(service['getPlaceTypesByTravelType'](TravelType.NATURE)).toEqual([
        'park',
        'aquarium',
        'zoo',
        'campground',
      ]);
      expect(service['getPlaceTypesByTravelType'](TravelType.RELAX)).toEqual([
        'spa',
        'beauty_salon',
        'hair_care',
        'park',
      ]);
      expect(
        service['getPlaceTypesByTravelType']('INVALID' as TravelType),
      ).toEqual(['tourist_attraction']);
    });
  });
});
