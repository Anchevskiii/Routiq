import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetAlternativesDto {
  @ApiProperty({
    description: 'The destination/city to fetch alternatives for',
    example: 'Paris, France',
  })
  @IsString()
  @IsNotEmpty()
  destination!: string;
}
