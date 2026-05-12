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
        `- ID: ${attr.id} | Name: ${attr.name} | Type: ${attr.type}`,
    )
    .join('\n');

  return `ROLE: Travel Assistant.
MISSION: Create a ${days}-day ${travelType} itinerary for ${destination}.

AVAILABLE PLACES:
${serializedAttractions}

INSTRUCTIONS:
1. Use ONLY the provided place IDs.
2. Output STRICT JSON format.
3. NO descriptions, NO tips, NO markdown code fences, NO prose.
4. Each day must have 3-5 activities (including 1-2 meals).

OUTPUT SCHEMA (JSON array of objects):
[
  { 
    "day": 1, 
    "theme": "Exploring the Heart of the City", 
    "activities": [
      { "placeId": "string", "time": "HH:MM", "type": "attraction|restaurant" }
    ] 
  }
]`;
}
