import { TravelType } from '@prisma/client';
import { FormattedPlace } from '../../attractions/types';
import { WeatherData } from '../../weather/types';

interface PromptParams {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travelType: TravelType;
  weatherData: WeatherData;
  attractions: FormattedPlace[];
  travelTimeContext: string;
}

export function buildItineraryPrompt(params: PromptParams): string {
  const { destination, days, travelType, attractions } = params;

  const serializedAttractions = attractions
    .map(
      (attr) =>
        `- ID: ${attr.id} | Name: ${attr.name} | Type: ${attr.type} | Source: ${attr.sourceType || 'unknown'} | Lat: ${attr.location.lat}, Lng: ${attr.location.lng}`,
    )
    .join('\n');

  return `ROLE: Travel Assistant.
MISSION: Create a ${days}-day ${travelType} itinerary for ${destination}.

AVAILABLE PLACES:
${serializedAttractions}

INSTRUCTIONS:
1. Use ONLY the provided place IDs.
2. NO descriptions, NO tips, NO markdown code fences, NO prose.
3. For each day, you MUST select EXACTLY 5 places:
   - 2 places MUST be "mainstream" attractions (source: mainstream).
   - 2 places MUST be "niche" activities specific to the travel type (source: niche).
   - Exactly 1 of these 5 places MUST be a highly popular meal/restaurant recommendation (source: dining).
4. You MUST cluster activities per day based on their geographic location (Lat/Lng) to minimize travel time.
5. For each activity, set a realistic "duration" in HOURS (number or string). Use these ranges:
  - Meals/restaurants: 1.0 to 1.5
  - Museums/major attractions: 2.0 to 3.0
  - Parks/viewpoints/walks: 1.0 to 2.0
  - Tours/experiences: 2.0 to 4.0
  Do NOT default everything to 1.5.
6. OUTPUT FORMAT: A raw JSON array of day objects. Each day object must have: "day" (number), "theme" (string), and "activities" (array of objects with "placeId", "title", "time", "duration" (hours as number or string, e.g. 1.5), "type").`;
}
