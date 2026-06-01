import { apiClient } from '@/api/axios'
import { supabase } from '@/api/supabase'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Activity, AddActivityDto, Itinerary, CreateItineraryDto, UpdateActivityDto } from '@/types/itinerary.types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const ITINERARY_ENDPOINTS = {
  GENERATE: `${BASE_URL}/itinerary/generate`,
}

export const itineraryApi = {
  async generateItinerary(payload: CreateItineraryDto): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(ITINERARY_ENDPOINTS.GENERATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
  },

  async getItinerary(id: string): Promise<Itinerary> {
    const response = await apiClient.get<ApiResponse<Itinerary>>(`/itinerary/${id}`)
    return response.data.data
  },

  async listItineraries(params?: Record<string, unknown>): Promise<PaginatedResponse<Itinerary>> {
    const response = await apiClient.get<PaginatedResponse<Itinerary>>('/itinerary', { params })
    return response.data
  },

  async updateItinerary(id: string, payload: unknown): Promise<Itinerary> {
    const response = await apiClient.patch<ApiResponse<Itinerary>>(`/itinerary/${id}`, payload)
    return response.data.data
  },

  async deleteItinerary(id: string): Promise<void> {
    await apiClient.delete(`/itinerary/${id}`)
  },

  async shareItinerary(id: string): Promise<{ shareLink: string }> {
    const response = await apiClient.post<ApiResponse<{ shareLink: string }>>(`/itinerary/${id}/share`)
    return response.data.data
  },

  async reorderDays(id: string, dayIds: string[]): Promise<Itinerary> {
    const response = await apiClient.put<ApiResponse<Itinerary>>(`/itinerary/${id}/days/reorder`, { dayIds })
    return response.data.data
  },

  async reorderActivities(id: string, dayId: string, activityIds: string[]): Promise<void> {
    await apiClient.put(`/itinerary/${id}/days/${dayId}/activities/reorder`, { activityIds })
  },

  async updateActivity(id: string, activityId: string, payload: UpdateActivityDto): Promise<Activity> {
    const response = await apiClient.patch<ApiResponse<Activity>>(`/itinerary/${id}/activities/${activityId}`, payload)
    return response.data.data
  },

  async addActivity(id: string, dayId: string, payload: AddActivityDto): Promise<Activity> {
    const response = await apiClient.post<ApiResponse<Activity>>(`/itinerary/${id}/days/${dayId}/activities`, payload)
    return response.data.data
  },

  async deleteActivity(id: string, activityId: string): Promise<void> {
    await apiClient.delete(`/itinerary/${id}/activities/${activityId}`)
  },
}
