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
}
