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
        `- ID: ${attr.id} | Name: ${attr.name} | Address: ${attr.address} | Type: ${attr.type} | Coords: ${attr.location.lat},${attr.location.lng} | Rating: ${attr.rating}`,
    )
    .join('\n');

  return `ROLE: Geographical Logistics Engine.
MISSION: Create a ${days}-day ${travelType} itinerary for ${destination}.
GOAL: Minimize travel time between stops using geographical proximity.

AVAILABLE PLACES:
${serializedAttractions}

INSTRUCTIONS:
1. Act ONLY as a logistics engine. 
2. Use ONLY the provided place IDs.
3. Cluster activities by location to save travel time.
4. Output STRICT JSON format.
5. NO descriptions, NO tips, NO markdown code fences, NO prose.
6. Days must be sequential: Day 1, Day 2, etc.
7. Each day must have 3-4 activities (including 1-2 meals).

OUTPUT SCHEMA (JSON array):
[
  {
    "day": 1,
    "activities": [
      {
        "placeId": "string from AVAILABLE PLACES",
        "shortName": "string",
        "type": "attraction|restaurant",
        "time": "HH:MM"
      }
    ]
  }
]

DO NOT write anything else besides the JSON array.`;
}
