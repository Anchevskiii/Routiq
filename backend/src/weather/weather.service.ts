import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { ForecastDay, WeatherData } from './types';

interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number; // probability of precipitation
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  // Cache weather data for 1 hour
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(private readonly configService: AppConfigService) {
    this.apiKey = this.configService.getOpenWeatherApiKey();
  }

  private getApiKeyOrThrow(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'OpenWeather API is not configured',
      );
    }
    return this.apiKey;
  }

  async getForecast(
    destination: string,
    startDate: string,
    days: number,
  ): Promise<WeatherData> {
    const cacheKey = `${destination}-${startDate}-${days}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      const coordinates = await this.getCoordinates(destination);

      if (!coordinates) {
        throw new ServiceUnavailableException('Location not found');
      }

      const [currentWeather, forecastData] = await Promise.all([
        this.getCurrentWeather(coordinates.lat, coordinates.lng),
        this.getForecastData(coordinates.lat, coordinates.lng, days),
      ]);

      const weatherData: WeatherData = {
        location: destination,
        current: {
          temperature: Math.round(currentWeather.main.temp),
          condition: currentWeather.weather[0].description,
          humidity: currentWeather.main.humidity,
          windSpeed: currentWeather.wind.speed,
        },
        forecast: forecastData.list
          .filter((item, index) => index < days * 8) // 8 forecasts per day (3-hour intervals)
          .reduce((acc: ForecastDay[], item) => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];

            let existing = acc.find((day) => day.date === date);
            if (!existing) {
              existing = {
                date,
                temperature: {
                  min: item.main.temp_min,
                  max: item.main.temp_max,
                },
                condition: item.weather[0].description,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed,
                precipitation: item.pop * 100,
              };
              acc.push(existing);
            } else {
              existing.temperature.min = Math.min(
                existing.temperature.min,
                item.main.temp_min,
              );
              existing.temperature.max = Math.max(
                existing.temperature.max,
                item.main.temp_max,
              );
              existing.precipitation = Math.max(
                existing.precipitation,
                item.pop * 100,
              );
            }

            return acc;
          }, [])
          .slice(0, days),
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new ServiceUnavailableException(
            'Weather data not available for this location',
          );
        }
        if (error.response?.status === 401) {
          throw new ServiceUnavailableException(
            'Weather service authentication failed',
          );
        }
        throw new ServiceUnavailableException(
          `Weather service error: ${error.message}`,
        );
      }
      throw new ServiceUnavailableException('Failed to fetch weather data');
    }
  }

  private async getCoordinates(
    destination: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct`,
        {
          params: {
            q: destination,
            limit: 1,
            appid: this.getApiKeyOrThrow(),
          },
          timeout: 10000,
        },
      );

      if (response.data.length === 0) {
        return null;
      }

      const location = response.data[0];
      return {
        lat: location.lat,
        lng: location.lon,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to get coordinates: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }

  private async getCurrentWeather(
    lat: number,
    lng: number,
  ): Promise<OpenWeatherResponse> {
    const response = await axios.get<OpenWeatherResponse>(
      `${this.baseUrl}/weather`,
      {
        params: {
          lat,
          lon: lng,
          appid: this.getApiKeyOrThrow(),
          units: 'metric',
        },
        timeout: 10000,
      },
    );

    return response.data;
  }

  private async getForecastData(
    lat: number,
    lng: number,
    days: number,
  ): Promise<OpenWeatherForecastResponse> {
    const response = await axios.get<OpenWeatherForecastResponse>(
      `${this.baseUrl}/forecast`,
      {
        params: {
          lat,
          lon: lng,
          appid: this.getApiKeyOrThrow(),
          units: 'metric',
          cnt: Math.min(days * 8, 40), // 8 forecasts per day, max 40 (5 days)
        },
        timeout: 10000,
      },
    );

    return response.data;
  }

  // Clear cache method for testing or manual refresh
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
