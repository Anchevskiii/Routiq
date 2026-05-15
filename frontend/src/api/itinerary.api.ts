import { apiClient } from '@/api/axios'
import { supabase } from '@/api/supabase'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Itinerary, CreateItineraryDto } from '@/types/itinerary.types'

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
}
