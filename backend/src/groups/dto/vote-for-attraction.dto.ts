import { IsString, IsNotEmpty } from 'class-validator';

export class VoteForAttractionDto {
  @IsString()
  @IsNotEmpty()
  attractionId: string;
}
