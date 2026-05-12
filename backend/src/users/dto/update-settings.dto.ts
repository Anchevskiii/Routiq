import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsBoolean() @IsOptional() groupInvitations?: boolean;
  @IsBoolean() @IsOptional() comments?: boolean;
  @IsBoolean() @IsOptional() votes?: boolean;
  @IsBoolean() @IsOptional() tripReminders?: boolean;
  @IsBoolean() @IsOptional() publicProfile?: boolean;
  @IsBoolean() @IsOptional() sharedItineraries?: boolean;
  @IsBoolean() @IsOptional() activityStatus?: boolean;
}
