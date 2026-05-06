export interface WeatherData {
  location: string
  current: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
  }
  forecast: Array<{
    date: string
    temperature: {
      min: number
      max: number
    }
    condition: string
    humidity: number
    windSpeed: number
    precipitation: number
  }>
}

export interface WeatherCondition {
  main: string
  description: string
  icon: string
}

export interface WeatherForecastParams {
  destination: string
  startDate: string
  days: number
}
