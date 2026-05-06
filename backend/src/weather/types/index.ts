/**
 * Current weather conditions
 */
export interface CurrentWeather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

/**
 * Single day weather forecast
 */
export interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

/**
 * Complete weather data for a location
 */
export interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}
