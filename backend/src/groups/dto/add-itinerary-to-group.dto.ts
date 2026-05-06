import { IsString, IsNotEmpty } from 'class-validator';

export class AddItineraryToGroupDto {
  @IsString()
  @IsNotEmpty()
  itineraryId: string;
}
