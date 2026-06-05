import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNotificationsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
