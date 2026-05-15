/**
 * Represents a formatted place/attraction from Google Places API
 * This type is exported for use in other modules that depend on attractions data
 */
export interface FormattedPlace {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  type: string;
  rating: number;
  userRatingsTotal: number;
  photos: string[];
  sourceType?: 'mainstream' | 'niche' | 'dining';
}
