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
5. OUTPUT FORMAT: A raw JSON array of day objects. Each day object must have: "day" (number), "theme" (string), and "activities" (array of objects with "placeId", "title", "time", "type").`;
}
