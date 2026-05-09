import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class VoteForAttractionDto {
  @IsString()
  @IsNotEmpty()
  activityId!: string;

  @IsString()
  @IsOptional()
  @IsIn(['UPVOTE', 'DOWNVOTE'])
  voteType?: string;
}
