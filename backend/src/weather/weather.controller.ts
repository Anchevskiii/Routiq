import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';
import { WeatherData } from './types';
import { GetWeatherForecastDto } from './dto/get-weather-forecast.dto';

@Controller('weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeatherForecast(
    @Query() query: GetWeatherForecastDto,
  ): Promise<WeatherData> {
    return this.weatherService.getForecast(
      query.destination,
      query.startDate,
      query.days,
    );
  }
}
