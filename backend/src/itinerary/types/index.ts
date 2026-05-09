/**
 * Activity within a day of the itinerary (from AI response)
 */
export interface GeneratedActivity {
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
 * Meal recommendation within a day (from AI response)
 */
export interface GeneratedMeal {
  type: string;
  recommendation: string;
  location: string;
  priceRange: string;
}

/**
 * Transportation details for a day (from AI response)
 */
export interface GeneratedTransportation {
  method: string;
  estimatedCost: string;
  notes: string;
}

/**
 * Weather information for a day (from AI response)
 */
export interface GeneratedDayWeather {
  condition: string;
  temperature: string;
  recommendations: string;
}

/**
 * A single day within a generated itinerary (from AI response)
 */
export interface GeneratedDay {
  day: number;
  date: string;
  theme: string;
  weather: GeneratedDayWeather;
  activities: GeneratedActivity[];
  meals: GeneratedMeal[];
  transportation: GeneratedTransportation;
}

/**
 * Summary information for a generated itinerary (from AI response)
 */
export interface GeneratedSummary {
  destination: string;
  totalDays: number;
  travelType: string;
  bestSeason: string;
  estimatedBudget: string;
}

/**
 * Complete AI-generated itinerary structure
 */
export interface GeneratedItinerary {
  summary: GeneratedSummary;
  days: GeneratedDay[];
  generalTips: string[];
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use GeneratedDay instead
 */
export type ItineraryDay = GeneratedDay;
