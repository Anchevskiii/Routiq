import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsHexColor,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'The name of the travel group',
    example: 'Summer Trip 2026',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'An optional description of the travel group',
    example: 'Our annual summer backpacking trip across Italy.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional URL for the group image/banner',
    example: 'https://example.com/images/italy.jpg',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional theme color in hex format',
    example: '#FF5733',
  })
  @IsHexColor()
  @IsOptional()
  themeColor?: string;
}
