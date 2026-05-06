import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [ConfigModule],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}

// Re-export types for consumers
export type { CurrentWeather, ForecastDay, WeatherData } from './types';
