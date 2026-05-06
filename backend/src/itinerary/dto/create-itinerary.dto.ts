import { ApiProperty } from '@nestjs/swagger';
import { TravelType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateItineraryDto {
  @ApiProperty({
    description: 'Travel destination',
    example: 'Paris, France',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  destination!: string;

  @ApiProperty({
    description: 'Trip start date',
    example: '2024-06-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'Trip end date',
    example: '2024-06-07T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({
    description: 'Number of days for the trip (1-14)',
    example: 7,
    minimum: 1,
    maximum: 14,
  })
  @IsInt()
  @Min(1)
  @Max(14)
  days!: number;

  @ApiProperty({
    description: 'Type of travel experience',
    enum: TravelType,
    example: TravelType.CULTURAL,
  })
  @IsEnum(TravelType)
  travelType!: TravelType;
}
