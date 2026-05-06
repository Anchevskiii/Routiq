import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
