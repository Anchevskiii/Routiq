import { apiClient } from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

// TODO: Create proper types in attractions.types.ts or use itinerary types
export interface Attraction {
  id: string;
  name: string;
  // add other fields
}

export const attractionsApi = {
  async searchAttractions(destination: string, travelType: string): Promise<Attraction[]> {
    const response = await apiClient.get<ApiResponse<Attraction[]>>('/attractions/search', {
      params: { destination, travelType },
    })
    return response.data.data
  },

  async swapAttraction(itineraryId: string, dayId: string, currentAttractionId: string, newAttractionId: string): Promise<void> {
    await apiClient.post(`/attractions/swap`, {
      itineraryId, dayId, currentAttractionId, newAttractionId
    })
  },

  async addAttraction(itineraryId: string, dayId: string, attractionId: string): Promise<void> {
    await apiClient.post(`/attractions/add`, {
      itineraryId, dayId, attractionId
    })
  },

  async removeAttraction(itineraryId: string, dayId: string, attractionId: string): Promise<void> {
    await apiClient.post(`/attractions/remove`, {
      itineraryId, dayId, attractionId
    })
  },
}
