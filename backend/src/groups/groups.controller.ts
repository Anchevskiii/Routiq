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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
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

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({ summary: 'Get all groups for the current user' })
  @ApiResponse({ status: 200, description: 'Returns a list of groups.' })
  @Get()
  async getUserGroups(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getUserGroups(user.sub);
  }

  @ApiOperation({ summary: 'Get pending invitations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of pending invitations.',
  })
  @Get('invitations')
  async getPendingInvitations(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getPendingInvitations(user.sub);
  }

  @ApiOperation({ summary: 'Get details of a specific group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Returns the group details.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  @Get(':id')
  async getGroupById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.getGroupById(id, user.sub);
  }

  @ApiOperation({ summary: 'Get group activity log' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns activities log.' })
  @Get(':id/activity-log')
  async getGroupActivityLog(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.groupsService.getGroupActivityLog(id, user.sub, limitNum);
  }

  @ApiOperation({ summary: 'Create a new travel group' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  @Post()
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user.sub, createGroupDto);
  }

  @ApiOperation({ summary: 'Update group details' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({ status: 200, description: 'Group updated successfully.' })
  @Patch(':id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(id, user.sub, updateGroupDto);
  }

  @ApiOperation({ summary: 'Upload group cover image' })
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadGroupImage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Max 5MB',
          }),
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|webp|gif|heic|heif)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: MulterFile,
  ) {
    return this.groupsService.uploadGroupImage(
      id,
      user.sub,
      file.buffer!,
      file.mimetype,
    );
  }

  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully.' })
  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.deleteGroup(id, user.sub);
  }

  // ─── Invitation Workflow ──────────────────────────────────

  @ApiOperation({ summary: 'Invite a member to the group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({ status: 201, description: 'Invitation sent.' })
  @Post(':id/invite')
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(id, user.sub, inviteMemberDto);
  }

  @ApiOperation({ summary: 'Accept group invitation' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Invitation accepted.' })
  @Post(':id/accept')
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.acceptInvitation(id, user.sub);
  }

  @ApiOperation({ summary: 'Decline group invitation' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Invitation declined.' })
  @Post(':id/decline')
  async declineInvitation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.declineInvitation(id, user.sub);
  }

  // ─── Member Management ────────────────────────────────────

  @ApiOperation({ summary: 'Remove a member from the group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'memberId', description: 'Member User ID' })
  @ApiResponse({ status: 200, description: 'Member removed.' })
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeMember(id, user.sub, memberId);
  }

  @ApiOperation({ summary: 'Update member role within the group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'memberId', description: 'Member User ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member role updated.' })
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

  @ApiOperation({ summary: 'Add an itinerary to the group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiBody({ type: AddItineraryToGroupDto })
  @ApiResponse({ status: 201, description: 'Itinerary added to the group.' })
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

  @ApiOperation({ summary: 'Remove an itinerary from the group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'groupItineraryId', description: 'Group Itinerary ID' })
  @ApiResponse({ status: 200, description: 'Itinerary removed.' })
  @Delete(':id/itineraries/:groupItineraryId')
  async removeItineraryFromGroup(
    @Param('id') id: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeItineraryFromGroup(
      id,
      user.sub,
      groupItineraryId,
    );
  }

  // ─── Voting & Comments ───────────────────────────────────

  @ApiOperation({ summary: 'Get all group comments' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Returns all comments.' })
  @Get(':groupId/comments')
  async getComments(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.getComments(groupId, user.sub);
  }

  @ApiOperation({ summary: 'Get all votes for a group itinerary' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'groupItineraryId', description: 'Group Itinerary ID' })
  @ApiResponse({ status: 200, description: 'Returns all votes.' })
  @Get(':groupId/itineraries/:groupItineraryId/votes')
  async getVotes(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.getVotes(groupId, groupItineraryId, user.sub);
  }

  @ApiOperation({ summary: 'Vote for a group itinerary' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'groupItineraryId', description: 'Group Itinerary ID' })
  @ApiBody({ type: VoteItineraryDto })
  @ApiResponse({ status: 201, description: 'Vote recorded.' })
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

  @ApiOperation({ summary: 'Remove vote from a group itinerary' })
  @Delete(':groupId/itineraries/:groupItineraryId/vote')
  async removeVote(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeVote(groupId, groupItineraryId, user.sub);
  }

  @ApiOperation({ summary: 'Add a comment to the group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiBody({ type: AddCommentDto })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  @Post(':groupId/comments')
  async addComment(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
    @Body() addCommentDto: AddCommentDto,
  ) {
    return this.groupsService.addComment(groupId, user.sub, addCommentDto);
  }

  @ApiOperation({ summary: 'Toggle reaction on a comment' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiBody({ type: AddReactionDto })
  @ApiResponse({ status: 200, description: 'Reaction toggled successfully.' })
  @Post(':groupId/comments/:commentId/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @Param('groupId') groupId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddReactionDto,
  ) {
    return this.groupsService.toggleReaction(
      groupId,
      commentId,
      user.sub,
      dto.emoji,
    );
  }
}
