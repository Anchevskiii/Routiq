import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAttractionsDto {
  @ApiProperty({
    description: 'The search query or keyword',
    example: 'museum',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'The location context (city/region)',
    example: 'Paris, France',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Radius around location to search in meters',
    example: 10000,
    minimum: 100,
    maximum: 50000,
    default: 10000,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(100)
  @Max(50000)
  radius?: number = 10000; // Default 10km
}
