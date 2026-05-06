import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Max, Min } from 'class-validator';

export class GetWeatherForecastDto {
  @IsString()
  destination: string;

  @IsDateString()
  startDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  days: number;
}
