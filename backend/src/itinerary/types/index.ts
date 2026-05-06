/**
 * Activity within a day of the itinerary
 */
export interface DayActivity {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  cost?: string;
  tips?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Meal recommendation within a day
 */
export interface DayMeal {
  type: string;
  recommendation: string;
  location: string;
  priceRange: string;
}

/**
 * Transportation details for a day
 */
export interface DayTransportation {
  method: string;
  estimatedCost: string;
  notes: string;
}

/**
 * Weather information for a day
 */
export interface DayWeather {
  condition: string;
  temperature: string;
  recommendations: string;
}

/**
 * A single day within an itinerary
 */
export interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  weather: DayWeather;
  activities: DayActivity[];
  meals: DayMeal[];
  transportation: DayTransportation;
}

/**
 * Summary information for an itinerary
 */
export interface ItinerarySummary {
  destination: string;
  totalDays: number;
  travelType: string;
  bestSeason: string;
  estimatedBudget: string;
}

/**
 * Complete generated itinerary structure from AI
 */
export interface GeneratedItinerary {
  summary: ItinerarySummary;
  days: ItineraryDay[];
  generalTips: string[];
}
