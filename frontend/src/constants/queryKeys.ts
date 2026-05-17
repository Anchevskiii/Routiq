export const QUERY_KEYS = {
  // Auth
  auth: ['auth'] as const,
  user: ['user'] as const,

  // Itineraries
  itineraries: ['itineraries'] as const,
  itinerary: (id: string) => ['itineraries', id] as const,
  sharedItinerary: (shareToken: string) => ['shared', 'itineraries', shareToken] as const,

  // Groups
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  groupItineraries: (groupId: string) => ['groups', groupId, 'itineraries'] as const,

  // Attractions
  attractions: ['attractions'] as const,
  attractionDetails: (id: string) => ['attractions', id] as const,
  attractionAlternatives: (id: string) => ['attractions', id, 'alternatives'] as const,

  // Weather
  weather: (destination: string, startDate: string, days: number) => 
    ['weather', destination, startDate, days] as const,

  // Profile
  profile: ['profile'] as const,
  settings: ['user-settings'] as const,
  itinerariesCount: ['itineraries', 'count'] as const,
  groupsCount: ['groups', 'count'] as const,

  // Export
  export: (id: string, type: string) => ['export', id, type] as const,
} as const

export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS]
