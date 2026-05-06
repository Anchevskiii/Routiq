export const TRAVEL_TYPES = {
  CULTURAL: {
    value: 'CULTURAL',
    label: 'Cultural',
    description: 'Museums, historical sites, and cultural experiences',
    icon: '🏛️',
    color: 'purple',
  },
  GASTRONOMIC: {
    value: 'GASTRONOMIC',
    label: 'Gastronomic',
    description: 'Local cuisine, food markets, and restaurants',
    icon: '🍽️',
    color: 'orange',
  },
  NATURE: {
    value: 'NATURE',
    label: 'Nature',
    description: 'Parks, outdoor activities, and natural landscapes',
    icon: '🌿',
    color: 'green',
  },
  ADVENTURE: {
    value: 'ADVENTURE',
    label: 'Adventure',
    description: 'Exciting activities and adrenaline experiences',
    icon: '🎢',
    color: 'red',
  },
} as const

export type TravelType = keyof typeof TRAVEL_TYPES
export type TravelTypeValue = typeof TRAVEL_TYPES[TravelType]['value']

export const getTravelTypeByValue = (value: string) => {
  return Object.values(TRAVEL_TYPES).find(type => type.value === value)
}

export const getTravelTypeOptions = () => {
  return Object.values(TRAVEL_TYPES).map(type => ({
    value: type.value,
    label: type.label,
    description: type.description,
    icon: type.icon,
  }))
}
