import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AddItineraryToGroupDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  itineraryId!: string;
}
