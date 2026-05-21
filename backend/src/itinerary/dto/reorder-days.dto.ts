import { IsArray, IsUUID } from 'class-validator';

export class ReorderDaysDto {
  @IsArray()
  @IsUUID('all', { each: true })
  dayIds!: string[];
}
