import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateItineraryDto {
  @ApiPropertyOptional({
    description: 'Updated destination of the itinerary',
    example: 'Milan, Italy',
    minLength: 2,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  destination?: string;

  @ApiPropertyOptional({
    description: 'Updated name of the itinerary',
    example: 'Milan Short Break 2026',
    maxLength: 120,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated start date of the trip',
    example: '2026-06-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Updated end date of the trip',
    example: '2026-06-05T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
