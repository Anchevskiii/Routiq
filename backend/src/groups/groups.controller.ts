import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { AddItineraryToGroupDto } from './dto/add-itinerary-to-group.dto';
import { VoteItineraryDto } from './dto/vote-itinerary.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getUserGroups(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getUserGroups(user.sub);
  }

  @Get('invitations')
  async getPendingInvitations(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getPendingInvitations(user.sub);
  }

  @Get(':id')
  async getGroupById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.getGroupById(id, user.sub);
  }

  @Get(':id/activity-log')
  async getGroupActivityLog(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.groupsService.getGroupActivityLog(id, user.sub, limitNum);
  }

  @Post()
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user.sub, createGroupDto);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(id, user.sub, updateGroupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.deleteGroup(id, user.sub);
  }

  // ─── Invitation Workflow ──────────────────────────────────

  @Post(':id/invite')
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(id, user.sub, inviteMemberDto);
  }

  @Post(':id/accept')
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.acceptInvitation(id, user.sub);
  }

  @Post(':id/decline')
  async declineInvitation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.declineInvitation(id, user.sub);
  }

  // ─── Member Management ────────────────────────────────────

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeMember(id, user.sub, memberId);
  }

  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(
      id,
      user.sub,
      memberId,
      updateMemberRoleDto.role,
    );
  }

  // ─── Group Itineraries ───────────────────────────────────

  @Post(':id/itineraries')
  async addItineraryToGroup(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() addItineraryToGroupDto: AddItineraryToGroupDto,
  ) {
    return this.groupsService.addItineraryToGroup(
      id,
      user.sub,
      addItineraryToGroupDto.itineraryId,
    );
  }

  @Delete(':id/itineraries/:groupItineraryId')
  async removeItineraryFromGroup(
    @Param('id') id: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeItineraryFromGroup(id, user.sub, groupItineraryId);
  }

  // ─── Voting & Comments ───────────────────────────────────

  @Get(':groupId/comments')
  async getComments(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.getComments(groupId, user.sub);
  }

  @Get(':groupId/itineraries/:groupItineraryId/votes')
  async getVotes(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.getVotes(groupId, groupItineraryId, user.sub);
  }

  @Post(':groupId/itineraries/:groupItineraryId/vote')
  async voteForItinerary(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
    @Body() voteItineraryDto: VoteItineraryDto,
  ) {
    return this.groupsService.voteForItinerary(
      groupId,
      groupItineraryId,
      user.sub,
      voteItineraryDto.voteType ?? 'UPVOTE',
    );
  }

  @Post(':groupId/comments')
  async addComment(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() addCommentDto: AddCommentDto,
  ) {
    return this.groupsService.addComment(groupId, user.sub, addCommentDto);
  }

  @Post(':groupId/comments/:commentId/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @Param('groupId') groupId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddReactionDto,
  ) {
    return this.groupsService.toggleReaction(groupId, commentId, user.sub, dto.emoji);
  }
}
