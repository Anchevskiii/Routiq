import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsHexColor,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsHexColor()
  @IsOptional()
  themeColor?: string;
}
