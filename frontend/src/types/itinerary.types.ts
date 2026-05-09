import { TravelTypeValue } from '@/constants/travelTypes'

export interface Itinerary {
  id: string
  userId: string
  destination: string
  startDate: string
  endDate: string
  travelType: TravelTypeValue
  weatherData?: WeatherData
  days: Day[]
  shareToken?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface Day {
  day: number
  date: string
  theme: string
  weather: {
    condition: string
    temperature: string
    recommendations: string
  }
  activities: Activity[]
  meals: Meal[]
  transportation: {
    method: string
    estimatedCost: string
    notes: string
  }
}

export interface Activity {
  time: string
  title: string
  description: string
  location: string
  duration: string
  cost: string
  tips: string
  coordinates: {
    lat: number
    lng: number
  }
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner'
  recommendation: string
  location: string
  priceRange: string
}

export interface WeatherData {
  location: string
  current: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
  }
  forecast: Array<{
    date: string
    temperature: {
      min: number
      max: number
    }
    condition: string
    humidity: number
    windSpeed: number
    precipitation: number
  }>
}

export interface CreateItineraryDto {
  destination: string
  startDate: string
  endDate: string
  days: number
  travelType: TravelTypeValue
}

export interface UpdateItineraryDto {
  destination?: string
  startDate?: string
  endDate?: string
}

export interface ItinerarySummary {
  id: string
  destination: string
  startDate: string
  endDate: string
  travelType: TravelTypeValue
  createdAt: string
  shareToken?: string
}
