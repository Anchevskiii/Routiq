import axios, { InternalAxiosRequestConfig } from 'axios'
import { supabase } from '@/api/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
})

let cachedToken: string | null = null

// Keep token in sync with auth state changes (also initializes token on startup)
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? null
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)
