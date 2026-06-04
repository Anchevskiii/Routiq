import { TravelType } from '@prisma/client';
import { buildItineraryPrompt } from './generate-itinerary.prompt';
import { FormattedPlace } from '../../attractions/types';
import { WeatherData } from '../../weather/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseWeatherData: WeatherData = {
  location: 'Paris, France',
  current: {
    condition: 'Sunny',
    temperature: 20,
    humidity: 55,
    windSpeed: 8,
  },
  forecast: [
    {
      date: '2024-06-01',
      condition: 'Sunny',
      temperature: { min: 15, max: 25 },
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
    },
  ],
};

const baseAttractions: FormattedPlace[] = [
  {
    id: 'place-1',
    name: 'Eiffel Tower',
    address: 'Champ de Mars',
    description: 'Iconic landmark',
    type: 'landmark',
    sourceType: 'mainstream',
    photos: [],
    rating: 4.8,
    userRatingsTotal: 10000,
    location: { lat: 48.8584, lng: 2.2945 },
  },
  {
    id: 'place-2',
    name: 'Hidden Cafe',
    address: '10 Rue du Temple',
    description: 'Local gem',
    type: 'cafe',
    sourceType: 'niche',
    photos: [],
    rating: 4.5,
    userRatingsTotal: 200,
    location: { lat: 48.8608, lng: 2.3523 },
  },
];

const baseParams = {
  destination: 'Paris, France',
  startDate: '2024-06-01T00:00:00.000Z',
  endDate: '2024-06-07T00:00:00.000Z',
  days: 7,
  travelType: TravelType.CULTURAL,
  weatherData: baseWeatherData,
  attractions: baseAttractions,
  travelTimeContext: '',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildItineraryPrompt', () => {
  it('returns a non-empty string', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the destination in the prompt', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('Paris, France');
  });

  it('includes the number of days in the prompt', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('7');
  });

  it('includes the travel type in the prompt', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('CULTURAL');
  });

  it('includes each attraction id and name', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('place-1');
    expect(result).toContain('Eiffel Tower');
    expect(result).toContain('place-2');
    expect(result).toContain('Hidden Cafe');
  });

  it('includes attraction source types in the serialized list', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('mainstream');
    expect(result).toContain('niche');
  });

  it('includes lat/lng coordinates in the attraction list', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('48.8584');
    expect(result).toContain('2.2945');
  });

  it('uses "unknown" as sourceType fallback when not provided', () => {
    const attractionsWithoutSource: FormattedPlace[] = [
      {
        ...baseAttractions[0],
        sourceType: undefined,
      },
    ];
    const result = buildItineraryPrompt({
      ...baseParams,
      attractions: attractionsWithoutSource,
    });
    expect(result).toContain('unknown');
  });

  it('produces an empty AVAILABLE PLACES section when attractions is empty', () => {
    const result = buildItineraryPrompt({ ...baseParams, attractions: [] });
    expect(result).toContain('AVAILABLE PLACES:');
    // No attraction IDs should appear
    expect(result).not.toContain('place-1');
  });

  it('includes all INSTRUCTIONS keywords', () => {
    const result = buildItineraryPrompt(baseParams);
    expect(result).toContain('INSTRUCTIONS');
    expect(result).toContain('ROLE');
    expect(result).toContain('MISSION');
  });
});
