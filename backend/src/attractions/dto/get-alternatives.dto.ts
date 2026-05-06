import { IsString, IsNotEmpty } from 'class-validator';

export class GetAlternativesDto {
  @IsString()
  @IsNotEmpty()
  destination: string;
}
