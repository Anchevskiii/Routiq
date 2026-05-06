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
}

function getTravelTypeDescription(travelType: TravelType): string {
  switch (travelType as string) {
    case 'CULTURAL':
      return 'focused on museums, historical sites, cultural experiences, and local traditions';
    case 'GASTRONOMIC':
      return 'focused on local cuisine, food markets, cooking classes, and restaurant experiences';
    case 'ADVENTURE':
      return 'focused on adrenaline activities, extreme sports, and exciting experiences';
    case 'NATURE':
      return 'focused on outdoor activities, parks, natural landscapes, and wildlife';
    case 'RELAX':
      return 'focused on slower pace activities, wellness, scenic spots, and leisure time';
    default:
      return 'focused on personalized travel experiences';
  }
}

export function buildItineraryPrompt(params: PromptParams): string {
  const {
    destination,
    startDate,
    endDate,
    days,
    travelType,
    weatherData,
    attractions,
  } = params;

  return `You are an expert travel planner creating a detailed ${days}-day itinerary for ${destination}.

**Trip Details:**
- Destination: ${destination}
- Start Date: ${startDate}
- End Date: ${endDate}
- Duration: ${days} days
- Travel Type: ${travelType} (${getTravelTypeDescription(travelType)})

**Weather Forecast:**
${JSON.stringify(weatherData, null, 2)}

**Available Attractions:**
${attractions.map((attr) => `- ${attr.name}: ${attr.description || 'No description available'} (Type: ${attr.type || 'General'})`).join('\n')}

**Instructions:**
1. Create a comprehensive day-by-day itinerary that maximizes the travel experience
2. Consider the weather forecast when planning outdoor activities
3. Include relevant attractions from the provided list
4. Optimize the route to minimize travel time between locations
5. Include a mix of activities that match the ${travelType} travel style
6. Provide specific timing recommendations (start times, durations)
7. Include practical tips and recommendations for each activity

**Response Format:**
Return a JSON object with the following structure:
{
  "summary": {
    "destination": "${destination}",
    "totalDays": ${days},
    "travelType": "${travelType}",
    "bestSeason": "recommended travel season",
    "estimatedBudget": "budget estimate"
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Daily theme",
      "weather": {
        "condition": "sunny/cloudy/rainy",
        "temperature": "temperature range",
        "recommendations": "weather-related recommendations"
      },
      "activities": [
        {
          "time": "09:00",
          "title": "Activity title",
          "description": "Detailed description",
          "location": "Specific location",
          "duration": "duration in hours",
          "cost": "estimated cost",
          "tips": "practical tips",
          "coordinates": {
            "lat": latitude,
            "lng": longitude
          }
        }
      ],
      "meals": [
        {
          "type": "breakfast/lunch/dinner",
          "recommendation": "Restaurant or food recommendation",
          "location": "Location",
          "priceRange": "$$"
        }
      ],
      "transportation": {
        "method": "walking/taxi/public transport",
        "estimatedCost": "daily transport cost",
        "notes": "transportation tips"
      }
    }
  ],
  "generalTips": [
    "Important travel tips",
    "Cultural considerations",
    "Safety recommendations"
  ]
}

Please generate a realistic, well-researched itinerary that provides genuine value to travelers.`;
}
