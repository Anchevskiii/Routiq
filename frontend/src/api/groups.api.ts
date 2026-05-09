import { apiClient } from '@/api/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Group, Comment, Vote } from '@/types/group.types'
import type { Itinerary } from '@/types/itinerary.types'

export const groupsApi = {
  async getGroups(): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get<PaginatedResponse<Group>>('/groups')
    return response.data
  },

  async createGroup(payload: { name: string; description?: string }): Promise<Group> {
    const response = await apiClient.post<ApiResponse<Group>>('/groups', payload)
    return response.data.data
  },

  async getGroup(id: string): Promise<Group> {
    const response = await apiClient.get<ApiResponse<Group>>(`/groups/${id}`)
    return response.data.data
  },

  async inviteMember(groupId: string, email: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/invite`, { email })
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`)
  },

  async vote(groupId: string, groupItineraryId: string, activityId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<Vote> {
    const response = await apiClient.post<ApiResponse<Vote>>(`/groups/${groupId}/itineraries/${groupItineraryId}/vote`, {
      activityId, voteType
    })
    return response.data.data
  },

  async addComment(groupId: string, groupItineraryId: string, content: string): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>(`/groups/${groupId}/itineraries/${groupItineraryId}/comments`, {
      content
    })
    return response.data.data
  },

  async getGroupItineraries(groupId: string): Promise<Itinerary[]> {
    const response = await apiClient.get<ApiResponse<Itinerary[]>>(`/groups/${groupId}/itineraries`)
    return response.data.data
  }
}
