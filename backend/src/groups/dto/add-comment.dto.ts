import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
