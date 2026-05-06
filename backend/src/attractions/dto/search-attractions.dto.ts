import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAttractionsDto {
  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(100)
  @Max(50000)
  radius?: number = 10000; // Default 10km
}
