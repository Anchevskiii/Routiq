import { Module } from '@nestjs/common';
import { AttractionsModule } from '../attractions/attractions.module';
import { ConfigModule as AppConfigModule } from '../config/config.module';
import { GeminiModule } from '../gemini/gemini.module';
import { WeatherModule } from '../weather/weather.module';
import { ItineraryController } from './itinerary.controller';
import { ItineraryGenerationService } from './itinerary-generation.service';
import { ItineraryThrottlerGuard } from './guards/itinerary-throttler.guard';
import { ItineraryService } from './itinerary.service';

@Module({
  imports: [GeminiModule, AttractionsModule, AppConfigModule, WeatherModule],
  controllers: [ItineraryController],
  providers: [
    ItineraryService,
    ItineraryGenerationService,
    ItineraryThrottlerGuard,
  ],
  exports: [ItineraryService],
})
export class ItineraryModule {}

// Re-export types for consumers
export type {
  GeneratedActivity,
  GeneratedDay,
  GeneratedDayWeather,
  GeneratedItinerary,
  GeneratedMeal,
  GeneratedSummary,
  GeneratedTransportation,
} from './types';
