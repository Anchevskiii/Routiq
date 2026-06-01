import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Max, Min } from 'class-validator';

export class GetWeatherForecastDto {
  @ApiProperty({
    description: 'The destination name/address for the weather forecast',
    example: 'Paris, France',
  })
  @IsString()
  destination!: string;

  @ApiProperty({
    description: 'Trip start date in YYYY-MM-DD format',
    example: '2026-06-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Number of days to forecast (1 to 5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  days!: number;
}
