import { supabase } from '@/api/supabase'
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

  async changePassword({ newPassword }: { newPassword: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/account')
  },

  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<ApiResponse<UserSettings>>('/users/settings')
    return response.data.data
  },

  async updateSettings(payload: Partial<UserSettings>): Promise<UserSettings> {
    const response = await apiClient.patch<ApiResponse<UserSettings>>('/users/settings', payload)
    return response.data.data
  },
}

export interface UserSettings {
  groupInvitations: boolean
  comments: boolean
  votes: boolean
  tripReminders: boolean
  publicProfile: boolean
  sharedItineraries: boolean
  activityStatus: boolean
}
