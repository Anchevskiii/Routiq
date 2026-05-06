import { apiClient } from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Profile, UpdateProfileDto } from '@/types/profile.types'

export const profileApi = {
  async getProfile(): Promise<Profile> {
    const response = await apiClient.get<ApiResponse<Profile>>('/users/profile')
    return response.data.data
  },

  async updateProfile(payload: UpdateProfileDto): Promise<Profile> {
    const response = await apiClient.patch<ApiResponse<Profile>>('/users/profile', payload)
    return response.data.data
  },

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

  async changePassword(payload: unknown): Promise<void> {
    await apiClient.post('/users/password', payload)
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/account')
  }
}
