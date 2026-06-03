import { apiClient } from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface AppNotification {
  id: string
  type: 'GROUP_INVITATION' | 'COMMENT' | 'VOTE' | 'TRIP_REMINDER'
  title: string
  body?: string
  data?: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: AppNotification[]
  total: number
  unread: number
  page: number
  limit: number
  totalPages: number
}

export const notificationsApi = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const res = await apiClient.get<ApiResponse<NotificationsResponse>>('/notifications', { params: { page, limit } })
    return res.data.data
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
    return res.data.data.count
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await apiClient.post('/notifications/read-all')
  },
}
