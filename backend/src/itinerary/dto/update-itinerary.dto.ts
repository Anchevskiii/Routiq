import { Type } from 'class-transformer';
import { IsDate, IsObject, IsOptional, IsString } from 'class-validator';
import { ItineraryDay } from '../types';

export class UpdateItineraryDto {
  @IsString()
  @IsOptional()
  destination?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsObject()
  @IsOptional()
  days?: ItineraryDay[];

  @IsString()
  @IsOptional()
  shareToken?: string;
}
