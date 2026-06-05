import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TravelType } from '@prisma/client';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { withRetry } from '../common';
import { FormattedPlace } from './types';

interface GooglePlaceLegacy {
  place_id: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    width?: number;
    height?: number;
  }>;
  editorial_summary?: {
    overview?: string;
  };
}

@Injectable()
export class AttractionsService {
  private readonly logger = new Logger(AttractionsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  // Cache Places API search queries for 24 hours
  private searchCache = new Map<
    string,
    { data: FormattedPlace[]; timestamp: number }
  >();
  private readonly searchCacheDuration = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(private readonly configService: AppConfigService) {
    this.apiKey = this.configService.getGooglePlacesApiKey();
  }

  private getApiKeyOrThrow(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Google Places API is not configured',
      );
    }
    // Strip quotes if they exist (common issue in .env files)
    return this.apiKey.replace(/^["']|["']$/g, '');
  }

  private calculateDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getPlaceCategory(place: FormattedPlace): string {
    const type = (place.type || '').toLowerCase();
    const nameLower = place.name.toLowerCase();

    if (place.sourceType === 'dining') {
      return 'dining';
    }

    const diningTypes = [
      'restaurant',
      'cafe',
      'food',
      'bakery',
      'bar',
      'meal_takeaway',
      'meal_delivery',
    ];
    if (
      diningTypes.includes(type) ||
      diningTypes.some((t) => nameLower.includes(t))
    ) {
      return 'dining';
    }

    const sightseeingTypes = [
      'museum',
      'art_gallery',
      'tourist_attraction',
      'church',
      'castle',
      'place_of_worship',
      'monument',
      'city_hall',
      'synagogue',
      'mosque',
      'hindu_temple',
    ];
    if (
      sightseeingTypes.includes(type) ||
      sightseeingTypes.some((t) => nameLower.includes(t))
    ) {
      return 'sightseeing';
    }

    const outdoorTypes = [
      'park',
      'campground',
      'amusement_park',
      'zoo',
      'aquarium',
      'national_park',
      'natural_feature',
      'beach',
      'garden',
    ];
    if (
      outdoorTypes.includes(type) ||
      outdoorTypes.some((t) => nameLower.includes(t))
    ) {
      return 'outdoors';
    }

    return 'other';
  }

  private areNamesSimilar(name1: string, name2: string): boolean {
    const normalize = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const words1 = normalize(name1);
    const words2 = normalize(name2);

    if (words1.length === 0 || words2.length === 0) return false;

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const jaccard = intersection.size / union.size;
    return jaccard > 0.55;
  }

  private isUtilityPlace(place: FormattedPlace): boolean {
    const nameLower = place.name.toLowerCase();
    const genericKeywords = [
      'atm',
      'locker',
      'wc',
      'toilet',
      'bus stop',
      'subway station',
      'transit station',
      'train station',
      'parking',
      'car rental',
      'supermarket',
      'pharmacy',
      'police',
      'hospital',
      'baggage storage',
      'luggage storage',
      'airport',
      'taxi stand',
      'public restroom',
      'public toilet',
    ];
    return genericKeywords.some((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(nameLower);
    });
  }

  private isLowQuality(place: FormattedPlace): boolean {
    if (place.rating !== undefined && place.rating > 0 && place.rating < 3.2) {
      return true;
    }
    if (
      place.userRatingsTotal !== undefined &&
      place.userRatingsTotal > 0 &&
      place.userRatingsTotal < 3
    ) {
      return true;
    }
    return false;
  }

  async getCuratedPlaces(
    destination: string,
    travelType: TravelType,
    days: number,
  ): Promise<FormattedPlace[]> {
    const requiredMainstream = days * 2;
    const requiredNiche = days * 2;
    const requiredMeals = days * 1;

    this.logger.log(
      `Fetching curated places for ${destination} using Legacy Places API`,
    );

    const mainstreamPromise = this.searchLegacy(
      `top mainstream popular tourist attractions in ${destination}`,
    ).then((places) =>
      places.map((p) => ({ ...p, sourceType: 'mainstream' as const })),
    );

    const nicheTypes = this.getPlaceTypesByTravelType(travelType);
    const nicheQuery = `${nicheTypes.join(' OR ')} in ${destination}`;
    const nichePromise = this.searchLegacy(nicheQuery).then((places) =>
      places.map((p) => ({ ...p, sourceType: 'niche' as const })),
    );

    const diningPromise = this.searchLegacy(
      `top rated popular viral restaurants food in ${destination}`,
    ).then((places) =>
      places.map((p) => ({ ...p, sourceType: 'dining' as const })),
    );

    const [mainstream, niche, dining] = await Promise.all([
      mainstreamPromise,
      nichePromise,
      diningPromise,
    ]);

    const scorePlace = (p: FormattedPlace) =>
      (p.rating || 0) * Math.log10((p.userRatingsTotal || 0) + 1);

    // Merge and deduplicate exact IDs first
    const rawMerged = [...mainstream, ...niche, ...dining];
    const seen = new Set<string>();
    const uniqueCandidates = rawMerged.filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });

    // Filter out low quality and utility locations
    const filteredCandidates = uniqueCandidates.filter(
      (place) => !this.isUtilityPlace(place) && !this.isLowQuality(place),
    );

    // Sort by popularity/rating score
    filteredCandidates.sort((a, b) => scorePlace(b) - scorePlace(a));

    // Greedily select places, pruning duplicates based on proximity (30m similar categories) and name similarity (150m)
    const acceptedPlaces: FormattedPlace[] = [];
    for (const candidate of filteredCandidates) {
      let hasConflict = false;
      for (const accepted of acceptedPlaces) {
        const distance = this.calculateDistanceMeters(
          candidate.location.lat,
          candidate.location.lng,
          accepted.location.lat,
          accepted.location.lng,
        );

        // 1. Proximity and category check
        if (distance < 30) {
          const catCandidate = this.getPlaceCategory(candidate);
          const catAccepted = this.getPlaceCategory(accepted);
          if (catCandidate === catAccepted) {
            hasConflict = true;
            this.logger.debug(
              `Pruning '${candidate.name}' due to proximity (<30m: ${distance.toFixed(1)}m) and same category ('${catCandidate}') with '${accepted.name}'`,
            );
            break;
          }
        }

        // 2. Name similarity check within 150m
        if (distance < 150) {
          if (this.areNamesSimilar(candidate.name, accepted.name)) {
            hasConflict = true;
            this.logger.debug(
              `Pruning '${candidate.name}' due to distance (<150m: ${distance.toFixed(1)}m) and name similarity with '${accepted.name}'`,
            );
            break;
          }
        }
      }

      if (!hasConflict) {
        acceptedPlaces.push(candidate);
      }
    }

    // Slice back into category budgets to maintain balanced proportions
    const curatedMainstream = acceptedPlaces
      .filter((p) => p.sourceType === 'mainstream')
      .slice(0, requiredMainstream * 2);

    const curatedNiche = acceptedPlaces
      .filter((p) => p.sourceType === 'niche')
      .slice(0, requiredNiche * 2);

    const curatedDining = acceptedPlaces
      .filter((p) => p.sourceType === 'dining')
      .slice(0, requiredMeals * 2);

    const result = [
      ...curatedMainstream,
      ...curatedNiche,
      ...curatedDining,
    ];

    // Final uniqueness check
    const finalSeen = new Set<string>();
    const finalResult = result.filter((place) => {
      if (finalSeen.has(place.id)) return false;
      finalSeen.add(place.id);
      return true;
    });

    this.logger.log(
      `Curated ${finalResult.length} unique places (Mainstream: ${curatedMainstream.length}, Niche: ${curatedNiche.length}, Dining: ${curatedDining.length})`,
    );

    return finalResult;
  }

  private async searchLegacy(
    query: string,
    radius?: number,
  ): Promise<FormattedPlace[]> {
    const cacheKey = `${query}-${radius || ''}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.searchCacheDuration) {
      this.logger.log(`Cache hit for legacy Places search: ${query}`);
      return cached.data;
    }

    try {
      const response = await withRetry(
        () =>
          axios.get(`${this.baseUrl}/textsearch/json`, {
            params: {
              query,
              key: this.getApiKeyOrThrow(),
              ...(radius ? { radius } : {}),
            },
            timeout: 10000,
          }),
        {
          shouldRetry: (error) => {
            if (axios.isAxiosError(error)) {
              return (
                !error.response ||
                error.response.status === 429 ||
                error.response.status >= 500
              );
            }
            return true;
          },
        },
      );

      if (
        response.data.status !== 'OK' &&
        response.data.status !== 'ZERO_RESULTS'
      ) {
        this.logger.warn(
          `Legacy API returned status ${response.data.status} for query: ${query}`,
        );
        return [];
      }

      const results: GooglePlaceLegacy[] = response.data.results || [];
      const formatted = results.map((place) => this.formatLegacyPlace(place));

      // Store in cache
      this.searchCache.set(cacheKey, {
        data: formatted,
        timestamp: Date.now(),
      });

      return formatted;
    } catch (error) {
      this.logger.error(
        `Legacy search failed for '${query}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async searchAttractions(
    query: string,
    location?: string,
    radius?: number,
  ): Promise<FormattedPlace[]> {
    let fullQuery = query;
    if (location) {
      fullQuery = `${query} near ${location}`;
    }
    return this.searchLegacy(fullQuery, radius);
  }

  async getAttractionDetails(placeId: string): Promise<FormattedPlace> {
    try {
      const response = await withRetry(
        () =>
          axios.get(`${this.baseUrl}/details/json`, {
            params: {
              place_id: placeId,
              key: this.getApiKeyOrThrow(),
              fields:
                'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,editorial_summary',
            },
            timeout: 10000,
          }),
        {
          shouldRetry: (error) => {
            if (axios.isAxiosError(error)) {
              return (
                !error.response ||
                error.response.status === 429 ||
                error.response.status >= 500
              );
            }
            return true;
          },
        },
      );

      if (response.data.status !== 'OK') {
        throw new Error(`API status: ${response.data.status}`);
      }

      return this.formatLegacyPlace(response.data.result);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Failed to get attraction details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getAlternatives(
    placeId: string,
    destination: string,
  ): Promise<FormattedPlace[]> {
    try {
      const original = await this.getAttractionDetails(placeId);
      const alternatives = await this.searchAttractions(
        this.extractKeywordsFromName(original.name),
        destination,
      );
      return alternatives.filter((attr) => attr.id !== placeId).slice(0, 5);
    } catch {
      throw new ServiceUnavailableException('Failed to get alternatives');
    }
  }

  private getPlaceTypesByTravelType(travelType: TravelType): string[] {
    const travelTypeValue = travelType as string;

    switch (travelTypeValue) {
      case 'CULTURAL':
        return [
          'museum',
          'art_gallery',
          'place_of_worship',
          'church',
          'castle',
        ];
      case 'GASTRONOMIC':
        return ['restaurant', 'cafe', 'food', 'bakery'];
      case 'ADVENTURE':
        return ['amusement_park', 'aquarium', 'zoo', 'park'];
      case 'NATURE':
        return ['park', 'aquarium', 'zoo', 'campground'];
      case 'RELAX':
        return ['spa', 'beauty_salon', 'hair_care', 'park'];
      default:
        return ['tourist_attraction'];
    }
  }

  private formatLegacyPlace(place: GooglePlaceLegacy): FormattedPlace {
    return {
      id: place.place_id,
      name: place.name || 'Unknown Place',
      description:
        place.editorial_summary?.overview || this.generateDescription(place),
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      address: place.formatted_address || 'Address unavailable',
      type: place.types?.[0] || 'attraction',
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      photos: [],
    };
  }

  private generateDescription(place: GooglePlaceLegacy): string {
    const type = (place.types?.[0] || 'establishment').replace(/_/g, ' ');
    return `${place.name || 'This place'} is a ${type} located in ${place.formatted_address || 'the area'}.`;
  }

  private extractKeywordsFromName(name: string): string {
    return name.replace(/\b(the|and|or|of|in|at|to)\b/gi, '').trim();
  }

  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await withRetry(
        () =>
          axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address,
              key: this.getApiKeyOrThrow(),
            },
            timeout: 5000,
          }),
        {
          shouldRetry: (error) => {
            if (axios.isAxiosError(error)) {
              return (
                !error.response ||
                error.response.status === 429 ||
                error.response.status >= 500
              );
            }
            return true;
          },
        },
      );

      if (
        response.data.status === 'OK' &&
        response.data.results?.[0]?.geometry?.location
      ) {
        const loc = response.data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Geocoding failed for '${address}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }
}
