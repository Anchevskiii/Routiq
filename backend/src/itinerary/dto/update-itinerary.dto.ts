import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateItineraryDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  destination?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
