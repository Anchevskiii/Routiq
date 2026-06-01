import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the member to invite to the group',
    example: 'traveler@example.com',
  })
  @IsEmail()
  email!: string;
}
