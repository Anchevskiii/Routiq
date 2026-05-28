import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Receive email notification for group invitations' })
  @IsBoolean() @IsOptional() groupInvitations?: boolean;

  @ApiPropertyOptional({ description: 'Receive email notification when someone comments on your itineraries' })
  @IsBoolean() @IsOptional() comments?: boolean;

  @ApiPropertyOptional({ description: 'Receive email notification when someone votes on group itineraries' })
  @IsBoolean() @IsOptional() votes?: boolean;

  @ApiPropertyOptional({ description: 'Receive email reminders for upcoming trips' })
  @IsBoolean() @IsOptional() tripReminders?: boolean;

  @ApiPropertyOptional({ description: 'Make profile page public' })
  @IsBoolean() @IsOptional() publicProfile?: boolean;

  @ApiPropertyOptional({ description: 'Automatically publish shared itineraries' })
  @IsBoolean() @IsOptional() sharedItineraries?: boolean;

  @ApiPropertyOptional({ description: 'Display online activity status to group members' })
  @IsBoolean() @IsOptional() activityStatus?: boolean;
}
