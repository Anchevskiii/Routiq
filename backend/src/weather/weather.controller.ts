import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';
import { WeatherData } from './types';
import { GetWeatherForecastDto } from './dto/get-weather-forecast.dto';

@ApiTags('Weather')
@ApiBearerAuth()
@Controller('weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({ summary: 'Get weather forecast for a destination' })
  @ApiResponse({
    status: 200,
    description: 'Returns current and forecasted weather.',
  })
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
