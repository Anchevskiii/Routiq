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
        `- ${attr.id}: ${attr.name} (${attr.type}) | Source: ${attr.sourceType || 'unknown'} | Lat/Lng: ${attr.location.lat},${attr.location.lng}`,
    )
    .join('\n');

  return `ROLE: Travel Assistant.
MISSION: Create a ${days}-day ${travelType} itinerary for ${destination}.

AVAILABLE PLACES:
${serializedAttractions}

INSTRUCTIONS:
1. Use ONLY the provided place IDs for the activities.
2. For each day, select EXACTLY 5 places:
   - 2 mainstream attractions (Source: mainstream).
   - 2 niche activities specific to the ${travelType} theme (Source: niche).
   - 1 dining location (Source: dining).
3. Cluster activities geographically using their Lat/Lng to minimize daily transit time.
4. Assign realistic durations (in hours as number/string) based on type:
   - Meals: 1.0 to 1.5
   - Museums/major sights: 2.0 to 3.0
   - Parks/walks: 1.0 to 2.0
   - Tours/experiences: 2.0 to 4.0`;
}
