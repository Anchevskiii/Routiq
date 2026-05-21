import { apiClient } from '@/api/axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Group, Comment, Vote } from '@/types/group.types'
import type { Itinerary } from '@/types/itinerary.types'

export const groupsApi = {
  async getGroups(): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get<PaginatedResponse<Group>>('/groups')
    return response.data
  },

  async createGroup(payload: { 
    name: string; 
    description?: string; 
    imageUrl?: string; 
    themeColor?: string; 
  }): Promise<Group> {
    const response = await apiClient.post<ApiResponse<Group>>('/groups', payload)
    return response.data.data
  },

  async updateGroup(id: string, payload: {
    name?: string;
    description?: string;
    imageUrl?: string;
    themeColor?: string;
  }): Promise<Group> {
    const response = await apiClient.patch<ApiResponse<Group>>(`/groups/${id}`, payload)
    return response.data.data
  },

  async getGroup(id: string): Promise<Group> {
    const response = await apiClient.get<ApiResponse<Group>>(`/groups/${id}`)
    return response.data.data
  },

  async getPendingInvitations(): Promise<unknown[]> {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/groups/invitations')
    return response.data.data
  },

  async inviteMember(groupId: string, email: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/invite`, { email })
  },

  async acceptInvitation(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/accept`)
  },

  async declineInvitation(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/decline`)
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`)
  },

  async updateMemberRole(groupId: string, memberId: string, role: string): Promise<void> {
    await apiClient.patch(`/groups/${groupId}/members/${memberId}/role`, { role })
  },

  async vote(groupId: string, groupItineraryId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<Vote> {
    const response = await apiClient.post<ApiResponse<Vote>>(`/groups/${groupId}/itineraries/${groupItineraryId}/vote`, {
      voteType
    })
    return response.data.data
  },

  async addComment(groupId: string, content: string, parentId?: string): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>(`/groups/${groupId}/comments`, {
      content,
      parentId
    })
    return response.data.data
  },

  async getComments(groupId: string): Promise<Comment[]> {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/groups/${groupId}/comments`)
    return response.data.data
  },

  async toggleReaction(groupId: string, commentId: string, emoji: string): Promise<{ removed: boolean }> {
    const response = await apiClient.post<ApiResponse<{ removed: boolean }>>(
      `/groups/${groupId}/comments/${commentId}/reactions`,
      { emoji }
    )
    return response.data.data
  },

  async addItineraryToGroup(groupId: string, itineraryId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/itineraries`, { itineraryId })
  },

  async getGroupItineraries(groupId: string): Promise<Itinerary[]> {
    const response = await apiClient.get<ApiResponse<Itinerary[]>>(`/groups/${groupId}/itineraries`)
    return response.data.data
  }
}
