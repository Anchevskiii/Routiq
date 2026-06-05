import { ApiProperty } from '@nestjs/swagger';
import { TravelType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

function IsAfterProperty(
  propertyName: keyof CreateItineraryDto,
  validationOptions?: ValidationOptions,
) {
  return (object: object, property: string) => {
    registerDecorator({
      name: 'isAfterProperty',
      target: object.constructor,
      propertyName: property,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [
            keyof CreateItineraryDto,
          ];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName as string
          ];

          if (!(value instanceof Date) || !(relatedValue instanceof Date)) {
            return false;
          }

          return value.getTime() > relatedValue.getTime();
        },
      },
    });
  };
}

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
  @IsAfterProperty('startDate', {
    message: 'endDate must be after startDate',
  })
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

  @ApiProperty({
    description: 'Optional Group ID to automatically share the itinerary',
    required: false,
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiProperty({
    description: 'Optional latitude of the destination',
    required: false,
  })
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Optional longitude of the destination',
    required: false,
  })
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Optional Google Place ID of the destination',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeId?: string;
}
