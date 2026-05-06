import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AttractionsModule } from '../attractions/attractions.module';
import { GeminiModule } from '../gemini/gemini.module';
import { WeatherModule } from '../weather/weather.module';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';

@Module({
  imports: [
    GeminiModule,
    AttractionsModule,
    WeatherModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute per user for AI generation
        name: 'itinerary-generate',
      },
    ]),
  ],
  controllers: [ItineraryController],
  providers: [ItineraryService],
  exports: [ItineraryService],
})
export class ItineraryModule {}

// Re-export types for consumers
export type {
  DayActivity,
  DayMeal,
  DayTransportation,
  DayWeather,
  GeneratedItinerary,
  ItineraryDay,
  ItinerarySummary,
} from './types';
