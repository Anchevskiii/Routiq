import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TravelType } from '@prisma/client';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { FormattedPlace } from './types';

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface PlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
}

interface SearchParams {
  query: string;
  key: string;
  radius: number;
  location?: string;
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
    return this.apiKey;
  }

  async getAttractions(
    destination: string,
    travelType: TravelType,
  ): Promise<FormattedPlace[]> {
    const placeTypes = this.getPlaceTypesByTravelType(travelType);
    const allAttractions: GooglePlace[] = [];

    for (const placeType of placeTypes) {
      try {
        const attractions = await this.searchPlacesByType(
          destination,
          placeType,
        );
        allAttractions.push(...attractions);
      } catch (error) {
        this.logger.warn(
          `Failed to fetch attractions for type ${placeType}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    // Remove duplicates and format results
    const uniqueAttractions = this.removeDuplicates(allAttractions);

    return uniqueAttractions.map((attraction) => this.formatPlace(attraction));
  }

  async searchAttractions(
    query: string,
    location?: string,
    radius = 10000,
  ): Promise<FormattedPlace[]> {
    try {
      const params: SearchParams = {
        query,
        key: this.getApiKeyOrThrow(),
        radius,
      };

      if (location) {
        // If location is provided, use it as the center point
        const coords = await this.getCoordinates(location);
        if (coords) {
          params.location = `${coords.lat},${coords.lng}`;
        }
      }

      const response = await axios.get<PlacesResponse>(
        `${this.baseUrl}/textsearch/json`,
        { params, timeout: 10000 },
      );

      if (response.data.status !== 'OK') {
        throw new ServiceUnavailableException(
          `Places API error: ${response.data.status}`,
        );
      }

      return response.data.results.map((place) => this.formatPlace(place));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ServiceUnavailableException(
          `Failed to search attractions: ${error.message}`,
        );
      }
      throw new ServiceUnavailableException('Failed to search attractions');
    }
  }

  async getAttractionDetails(placeId: string): Promise<FormattedPlace> {
    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.getApiKeyOrThrow(),
          fields:
            'name,formatted_address,geometry,types,rating,user_ratings_total,photos,reviews,opening_hours,website,phone_number',
        },
        timeout: 10000,
      });

      if (response.data.status !== 'OK') {
        throw new ServiceUnavailableException(
          `Places API error: ${response.data.status}`,
        );
      }

      return this.formatPlace(response.data.result);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ServiceUnavailableException(
          `Failed to get attraction details: ${error.message}`,
        );
      }
      throw new ServiceUnavailableException('Failed to get attraction details');
    }
  }

  async getAlternatives(
    placeId: string,
    destination: string,
  ): Promise<FormattedPlace[]> {
    try {
      // Get the original attraction details
      const original = await this.getAttractionDetails(placeId);

      // Search for similar attractions nearby
      const alternatives = await this.searchAttractions(
        this.extractKeywordsFromName(original.name),
        destination,
        5000, // 5km radius
      );

      // Filter out the original attraction and return top alternatives
      return alternatives.filter((attr) => attr.id !== placeId).slice(0, 5);
    } catch {
      throw new ServiceUnavailableException('Failed to get alternatives');
    }
  }

  private async searchPlacesByType(
    destination: string,
    type: string,
  ): Promise<GooglePlace[]> {
    try {
      const coords = await this.getCoordinates(destination);

      if (!coords) {
        return [];
      }

      const response = await axios.get<PlacesResponse>(
        `${this.baseUrl}/nearbysearch/json`,
        {
          params: {
            location: `${coords.lat},${coords.lng}`,
            radius: 15000, // 15km radius
            type,
            key: this.getApiKeyOrThrow(),
          },
          timeout: 10000,
        },
      );

      if (response.data.status !== 'OK') {
        return [];
      }

      return response.data.results;
    } catch (error) {
      this.logger.warn(
        `Failed to search places by type ${type}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return [];
    }
  }

  private async getCoordinates(
    destination: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: destination,
          key: this.getApiKeyOrThrow(),
        },
        timeout: 10000,
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].geometry.location;
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to get coordinates: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }

  private getPlaceTypesByTravelType(travelType: TravelType): string[] {
    const travelTypeValue = travelType as string;

    switch (travelTypeValue) {
      case 'CULTURAL':
        return [
          'museum',
          'art_gallery',
          'historical_landmark',
          'church',
          'synagogue',
          'mosque',
          'hindu_temple',
        ];
      case 'GASTRONOMIC':
        return ['restaurant', 'cafe', 'food', 'bakery', 'bar'];
      case 'ADVENTURE':
        return [
          'amusement_park',
          'tourist_attraction',
          'bowling_alley',
          'movie_theater',
          'night_club',
        ];
      case 'NATURE':
        return [
          'park',
          'natural_feature',
          'campground',
          'hiking_area',
          'zoo',
          'aquarium',
        ];
      case 'RELAX':
        return ['spa', 'park', 'beach', 'tourist_attraction'];
      default:
        return ['tourist_attraction'];
    }
  }

  private removeDuplicates(places: GooglePlace[]): GooglePlace[] {
    const seen = new Set<string>();
    return places.filter((place) => {
      if (seen.has(place.place_id)) {
        return false;
      }
      seen.add(place.place_id);
      return true;
    });
  }

  private formatPlace(place: GooglePlace): FormattedPlace {
    return {
      id: place.place_id,
      name: place.name,
      description: this.generateDescription(place),
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      address: place.formatted_address,
      type: this.categorizeAttraction(place.types),
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      photos: place.photos?.map((photo) => photo.photo_reference) || [],
    };
  }

  private generateDescription(place: GooglePlace): string {
    const types = place.types.join(', ').replace(/_/g, ' ');
    return `${place.name} is a ${types} located at ${place.formatted_address}.`;
  }

  private categorizeAttraction(types: string[]): string {
    if (types.includes('museum')) return 'museum';
    if (types.includes('restaurant')) return 'restaurant';
    if (types.includes('park')) return 'park';
    if (types.includes('tourist_attraction')) return 'attraction';
    if (types.includes('historical_landmark')) return 'historical_site';
    return 'general';
  }

  private extractKeywordsFromName(name: string): string {
    // Simple keyword extraction - could be enhanced with NLP
    return name.replace(/\b(the|and|or|of|in|at|to)\b/gi, '').trim();
  }
}
