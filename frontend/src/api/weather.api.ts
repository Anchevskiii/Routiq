import { apiClient } from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { WeatherData } from '@/types/weather.types'

export const weatherApi = {
  async getWeatherForecast(destination: string, startDate: string, days: number): Promise<WeatherData[]> {
    const response = await apiClient.get<ApiResponse<WeatherData[]>>('/weather', {
      params: { destination, startDate, days },
    })
    return response.data.data
  },
}
