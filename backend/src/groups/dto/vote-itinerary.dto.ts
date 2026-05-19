import { IsString, IsOptional, IsIn } from 'class-validator';

export class VoteItineraryDto {
  @IsString()
  @IsOptional()
  @IsIn(['UPVOTE', 'DOWNVOTE'])
  voteType?: string;
}
