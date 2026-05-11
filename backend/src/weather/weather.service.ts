import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '../config/config.service';
import { ForecastDay, WeatherData } from './types';

interface GoogleForecastDay {
  displayDate: { year: number; month: number; day: number };
  minTemperature?: { degrees: number };
  maxTemperature?: { degrees: number };
  daytimeForecast?: {
    weatherCondition?: { description?: { text?: string } };
    relativeHumidity?: number;
    wind?: { speed?: { value?: number } };
    precipitation?: { probability?: { percent?: number } };
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly googleWeatherApiKey: string;
  private readonly googleWeatherBaseUrl = 'https://weather.googleapis.com/v1';

  // Cache weather data for 1 hour
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(private readonly configService: AppConfigService) {
    // Use the consolidated Google Weather API key (which is the same as Places/Directions)
    this.googleWeatherApiKey = this.configService.getGoogleWeatherApiKey();
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

      let weatherData: WeatherData | null = null;

      if (coordinates) {
        if (this.googleWeatherApiKey) {
          weatherData = await this.getForecastWithGoogle(
            coordinates.lat,
            coordinates.lng,
            destination,
            startDate,
            days,
          ).catch((err) => {
            this.logger.warn(`Google Weather API failed: ${err.message}`);
            return null;
          });
        } else {
          this.logger.warn('Google Weather API key is not configured');
        }
      }

      // Final fallback to mock data if API fails or coords not found
      if (!weatherData) {
        this.logger.log(`Using mock weather data for ${destination}`);
        weatherData = this.getMockWeather(destination, startDate, days);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Weather service encountered an error: ${message}`);
      return this.getMockWeather(destination, startDate, days);
    }
  }

  private async getCoordinates(
    destination: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const googleKey =
      this.googleWeatherApiKey || this.configService.getGooglePlacesApiKey();
    if (googleKey) {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              address: destination,
              key: googleKey,
            },
            timeout: 10000,
          },
        );

        if (
          response.data?.status === 'OK' &&
          response.data.results?.length > 0
        ) {
          return response.data.results[0].geometry.location;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.debug(`Google geocoding failed: ${message}`);
      }
    }

    return null;
  }

  private async getForecastWithGoogle(
    lat: number,
    lng: number,
    destination: string,
    startDateStr: string,
    days: number,
  ): Promise<WeatherData> {
    // Current conditions
    const currentRes = await axios.get(
      `${this.googleWeatherBaseUrl}/currentConditions:lookup`,
      {
        params: {
          key: this.googleWeatherApiKey,
          'location.latitude': lat,
          'location.longitude': lng,
        },
        timeout: 10000,
      },
    );

    // Forecast (Google supports up to 10 days)
    const forecastRes = await axios.get(
      `${this.googleWeatherBaseUrl}/forecast/days:lookup`,
      {
        params: {
          key: this.googleWeatherApiKey,
          'location.latitude': lat,
          'location.longitude': lng,
          days: 10,
        },
        timeout: 10000,
      },
    );

    const current = currentRes.data;
    const forecast = forecastRes.data;

    const mappedForecast = ((forecast.forecastDays as GoogleForecastDay[]) || []).map(
      (d: GoogleForecastDay) => ({
        date: `${d.displayDate.year}-${String(d.displayDate.month).padStart(
          2,
          '0',
        )}-${String(d.displayDate.day).padStart(2, '0')}`,
        temperature: {
          min: d.minTemperature?.degrees ?? 15,
          max: d.maxTemperature?.degrees ?? 25,
        },
        condition:
          d.daytimeForecast?.weatherCondition?.description?.text ?? 'Clear',
        humidity: d.daytimeForecast?.relativeHumidity ?? 50,
        windSpeed: d.daytimeForecast?.wind?.speed?.value ?? 0,
        precipitation:
          d.daytimeForecast?.precipitation?.probability?.percent ?? 0,
      }),
    );

    // Ensure we have weather for ALL trip days
    // We use the provided startDateStr as the absolute reference point
    const tripStart = new Date(startDateStr);
    
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(tripStart);
      targetDate.setUTCDate(targetDate.getUTCDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const exists = mappedForecast.some(f => f.date === targetDateStr);
      if (!exists) {
        // Find closest existing day or use defaults
        const lastKnown = mappedForecast[mappedForecast.length - 1];
        mappedForecast.push({
          date: targetDateStr,
          temperature: {
            min: lastKnown?.temperature.min ?? 15,
            max: lastKnown?.temperature.max ?? 25,
          },
          condition: lastKnown?.condition ?? 'Clear',
          humidity: lastKnown?.humidity ?? 50,
          windSpeed: lastKnown?.windSpeed ?? 0,
          precipitation: lastKnown?.precipitation ?? 0,
        });
      }
    }

    return {
      location: destination,
      current: {
        temperature: Math.round(current.temperature?.degrees ?? 20),
        condition: current.weatherCondition?.description?.text ?? 'Clear',
        humidity: current.relativeHumidity ?? 50,
        windSpeed: current.wind?.speed?.value ?? 0,
      },
      forecast: mappedForecast,
    };
  }

  private getMockWeather(
    destination: string,
    startDate: string,
    days: number,
  ): WeatherData {
    const start = new Date(startDate);
    const forecast: ForecastDay[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 15 + Math.floor(Math.random() * 5),
          max: 22 + Math.floor(Math.random() * 5),
        },
        condition: i % 3 === 0 ? 'Partly cloudy' : 'Sunny',
        humidity: 50 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 10),
        precipitation: Math.random() < 0.2 ? 15 : 0,
      });
    }

    return {
      location: destination,
      current: {
        temperature: 20,
        condition: 'Sunny',
        humidity: 60,
        windSpeed: 8,
      },
      forecast,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
