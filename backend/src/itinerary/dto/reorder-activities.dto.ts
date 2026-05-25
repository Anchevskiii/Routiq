import { IsArray, IsUUID } from 'class-validator';

export class ReorderActivitiesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  activityIds!: string[];
}
