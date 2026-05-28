import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    description: 'The title/name of the activity',
    example: 'Visit the Eiffel Tower',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'The location name or venue',
    example: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Formatted physical address of the activity',
    example: '5 Avenue Anatole France, 75007 Paris, France',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Google Places API Place ID',
    example: 'ChIJLU7jZClu5kcR4PcOO51p0Q0',
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinates',
    example: 48.8584,
  })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinates',
    example: 2.2945,
  })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'A brief description of what to do or see',
    example: 'Enjoy beautiful panoramic views of Paris from the top floor.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Activity duration in minutes',
    example: 120,
    minimum: 1,
    maximum: 1440,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Preferred start time in HH:MM format',
    example: '14:00',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM' })
  startTime?: string;
}
