import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { GetWeatherForecastDto } from './dto/get-weather-forecast.dto';
import { WeatherData } from './types';

describe('WeatherController', () => {
  let controller: WeatherController;
  let service: jest.Mocked<WeatherService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = {
      getForecast: jest.fn(),
    } as unknown as jest.Mocked<WeatherService>;

    controller = new WeatherController(service);
  });

  it('should call weatherService.getForecast and return the result', async () => {
    const query: GetWeatherForecastDto = {
      destination: 'Paris',
      startDate: '2026-06-04',
      days: 5,
    };
    const mockWeatherData: WeatherData = {
      location: 'Paris',
      current: { temperature: 20, condition: 'Sunny', humidity: 50, windSpeed: 10 },
      forecast: [],
    };
    service.getForecast.mockResolvedValue(mockWeatherData);

    const result = await controller.getWeatherForecast(query);
    expect(service.getForecast).toHaveBeenCalledWith('Paris', '2026-06-04', 5);
    expect(result).toBe(mockWeatherData);
  });
});
