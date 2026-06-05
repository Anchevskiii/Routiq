import { TravelTypeValue } from '@/constants/travelTypes'

export enum ActivityType {
  ATTRACTION = 'ATTRACTION',
  MEAL = 'MEAL',
  TRANSPORT = 'TRANSPORT',
}

export interface Itinerary {
  id: string
  userId: string
  destination: string
  name?: string
  startDate: string
  endDate: string
  travelType: TravelTypeValue
  totalDays: number
  bestSeason?: string
  estimatedBudget?: string
  days: Day[]
  generalTips?: Array<{ id: string; content: string; sortOrder: number }>
  shareToken?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    avatarUrl?: string
  }
  groupItineraries?: Array<{
    groupId: string
    group: {
      name: string
    }
  }>
}

export interface Day {
  id: string
  dayNumber: number
  date: string
  theme?: string
  weather?: {
    condition: string
    tempMin?: number
    tempMax?: number
    recommendation?: string
  }
  activities: Activity[]
}

export interface Activity {
  id: string
  activityType: ActivityType
  sortOrder: number
  title: string
  description?: string
  location?: string
  address?: string
  startTime?: string
  durationMinutes?: number
  cost?: string
  tips?: string
  latitude?: number
  longitude?: number
  placeId?: string
  mealType?: string
  priceRange?: string
}

export interface StreamingActivity {
  title: string
  startTime?: string
  activityType?: ActivityType
  [key: string]: unknown // Allow for other fields during streaming
}

export interface StreamingDay {
  dayNumber: number
  theme: string
  activities?: {
    create: StreamingActivity[]
  }
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
  name?: string
  startDate?: string
  endDate?: string
}

export interface UpdateActivityDto {
  title?: string
  startTime?: string
  durationMinutes?: number
}

export interface AddActivityResponse {
  activity: Activity
  trimmedActivity?: { id: string; title: string; newDurationMinutes: number }
  pushedActivities?: { id: string; title: string; newStartTime: string }[]
}

export interface AddActivityDto {
  title: string
  location?: string
  address?: string
  placeId?: string
  latitude?: number
  longitude?: number
  description?: string
  durationMinutes?: number
  startTime?: string
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
