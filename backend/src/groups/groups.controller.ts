import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddItineraryToGroupDto } from './dto/add-itinerary-to-group.dto';
import { VoteForAttractionDto } from './dto/vote-for-attraction.dto';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getUserGroups(@CurrentUser() user: JwtPayload) {
    return this.groupsService.getUserGroups(user.sub);
  }

  @Get(':id')
  async getGroupById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.getGroupById(id, user.sub);
  }

  @Post()
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(user.sub, createGroupDto);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.groupsService.deleteGroup(id, user.sub);
  }

  @Post(':id/invite')
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(id, user.sub, inviteMemberDto);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupsService.removeMember(id, user.sub, memberId);
  }

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

  @Post(':groupId/itineraries/:groupItineraryId/vote')
  async voteForAttraction(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
    @Body() voteForAttractionDto: VoteForAttractionDto,
  ) {
    return this.groupsService.voteForAttraction(
      groupId,
      groupItineraryId,
      user.sub,
      voteForAttractionDto.attractionId,
    );
  }

  @Post(':groupId/itineraries/:groupItineraryId/comments')
  async addComment(
    @Param('groupId') groupId: string,
    @Param('groupItineraryId') groupItineraryId: string,
    @CurrentUser() user: JwtPayload,
    @Body() addCommentDto: AddCommentDto,
  ) {
    return this.groupsService.addComment(
      groupId,
      groupItineraryId,
      user.sub,
      addCommentDto,
    );
  }
}
