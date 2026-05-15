import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TravelType } from '@prisma/client';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
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

    const curatedMainstream = mainstream
      .sort((a, b) => scorePlace(b) - scorePlace(a))
      .slice(0, requiredMainstream * 2);

    const curatedNiche = niche
      .sort((a, b) => scorePlace(b) - scorePlace(a))
      .slice(0, requiredNiche * 2);

    const curatedDining = dining
      .sort((a, b) => scorePlace(b) - scorePlace(a))
      .slice(0, requiredMeals * 2);

    const merged = [...curatedMainstream, ...curatedNiche, ...curatedDining];

    // Deduplicate by place ID
    const seen = new Set<string>();
    const result = merged.filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });

    this.logger.log(
      `Curated ${result.length} unique places (Mainstream: ${curatedMainstream.length}, Niche: ${curatedNiche.length}, Dining: ${curatedDining.length})`,
    );

    return result;
  }

  private async searchLegacy(
    query: string,
    radius?: number,
  ): Promise<FormattedPlace[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query,
          key: this.getApiKeyOrThrow(),
          ...(radius ? { radius } : {}),
        },
        timeout: 10000,
      });

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
      return results.map((place) => this.formatLegacyPlace(place));
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
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.getApiKeyOrThrow(),
          fields:
            'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,photos,editorial_summary',
        },
        timeout: 10000,
      });

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
      photos: place.photos?.map((p) => p.photo_reference) || [],
    };
  }

  private generateDescription(place: GooglePlaceLegacy): string {
    const type = (place.types?.[0] || 'establishment').replace(/_/g, ' ');
    return `${place.name || 'This place'} is a ${type} located in ${place.formatted_address || 'the area'}.`;
  }

  private extractKeywordsFromName(name: string): string {
    return name.replace(/\b(the|and|or|of|in|at|to)\b/gi, '').trim();
  }
}
