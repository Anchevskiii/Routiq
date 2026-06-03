import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GroupRole, InvitationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { MailService } from '../mail/mail.service';

const ROLE_HIERARCHY: Record<GroupRole, number> = {
  [GroupRole.OWNER]: 4,
  [GroupRole.ADMIN]: 3,
  [GroupRole.MODERATOR]: 2,
  [GroupRole.MEMBER]: 1,
};

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Group CRUD ───────────────────────────────────────────

  async getUserGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
            status: InvitationStatus.ACCEPTED,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          where: {
            status: InvitationStatus.ACCEPTED,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: {
              where: { status: InvitationStatus.ACCEPTED },
            },
            itineraries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return groups.map((group: (typeof groups)[number]) => ({
      ...group,
      memberCount: group._count.members,
      itineraryCount: group._count.itineraries,
    }));
  }

  async getGroupById(groupId: string, userId: string) {
    // Verify user is an accepted member
    await this.requireAcceptedMember(groupId, userId);

    const group = await this.prisma.group.findFirst({
      where: { id: groupId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            invitedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            reactions: {
              select: {
                emoji: true,
                userId: true,
              },
            },
            replies: {
              where: { deletedAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
                reactions: {
                  select: {
                    emoji: true,
                    userId: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          where: {
            parentId: null,
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        itineraries: {
          where: {
            deletedAt: null,
          },
          include: {
            itinerary: {
              select: {
                id: true,
                destination: true,
                startDate: true,
                endDate: true,
                travelType: true,
                totalDays: true,
                createdAt: true,
                deletedAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            votes: {
              select: {
                voteType: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Calculate scores for itineraries, excluding soft-deleted itineraries
    const itineraries = group.itineraries
      .filter((gi) => gi.itinerary && !gi.itinerary.deletedAt)
      .map((gi) => {
        const upvotes = gi.votes.filter((v) => v.voteType === 'UPVOTE').length;
        const downvotes = gi.votes.filter(
          (v) => v.voteType === 'DOWNVOTE',
        ).length;
        return {
          ...gi,
          score: upvotes - downvotes,
        };
      });

    return {
      ...group,
      itineraries,
    };
  }
  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        imageUrl: createGroupDto.imageUrl,
        themeColor: createGroupDto.themeColor,
        createdById: userId,
        members: {
          create: {
            userId,
            role: GroupRole.OWNER,
            status: InvitationStatus.ACCEPTED,
            joinedAt: new Date(),
            respondedAt: new Date(),
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await this.logActivity(group.id, userId, 'GROUP_CREATED', {
      groupName: group.name,
    });

    return group;
  }

  async updateGroup(
    groupId: string,
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ) {
    await this.requireRole(groupId, userId, [GroupRole.OWNER, GroupRole.ADMIN]);

    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: updateGroupDto.name,
        description: updateGroupDto.description,
        imageUrl: updateGroupDto.imageUrl,
        themeColor: updateGroupDto.themeColor,
      },
    });

    await this.logActivity(groupId, userId, 'GROUP_UPDATED');

    return group;
  }

  async uploadGroupImage(groupId: string, userId: string, buffer: Buffer, mimetype: string): Promise<{ imageUrl: string }> {
    await this.requireRole(groupId, userId, [GroupRole.OWNER, GroupRole.ADMIN]);

    const client = this.supabaseService.getClient();
    if (!client) throw new InternalServerErrorException('Storage service unavailable');

    const ext = mimetype.split('/')[1] ?? 'jpg';
    const path = `groups/${groupId}/${Date.now()}.${ext}`;

    const { error } = await client.storage
      .from('group-images')
      .upload(path, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      this.logger.error(`Group image upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload image');
    }

    const { data } = client.storage.from('group-images').getPublicUrl(path);
    const imageUrl = data.publicUrl;

    await this.prisma.group.update({ where: { id: groupId }, data: { imageUrl } });

    return { imageUrl };
  }

  async deleteGroup(groupId: string, userId: string) {
    await this.requireRole(groupId, userId, [GroupRole.OWNER]);

    await this.prisma.group.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Group deleted successfully' };
  }

  // ─── Invitation Workflow ──────────────────────────────────

  async inviteMember(
    groupId: string,
    inviterId: string,
    inviteMemberDto: InviteMemberDto,
  ) {
    // Only OWNER, ADMIN can invite (as per new matrix)
    await this.requireRole(groupId, inviterId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    // Find the user to invite
    const userToInvite = await this.prisma.user.findUnique({
      where: { email: inviteMemberDto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException(
        'User with this email does not exist. They must have an account on Routiq.',
      );
    }

    // Check if user already has a membership record
    const existingMembership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: userToInvite.id,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === InvitationStatus.ACCEPTED) {
        throw new BadRequestException('User is already a member of this group');
      }
      if (existingMembership.status === InvitationStatus.PENDING) {
        throw new BadRequestException(
          'User already has a pending invitation to this group',
        );
      }
      // If previously declined/expired/cancelled, re-invite
      const updatedMembership = await this.prisma.groupMember.update({
        where: { id: existingMembership.id },
        data: {
          status: InvitationStatus.PENDING,
          invitedById: inviterId,
          invitedAt: new Date(),
          respondedAt: null,
          joinedAt: null,
          role: GroupRole.MEMBER,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      await this.logActivity(groupId, inviterId, 'MEMBER_RE_INVITED', {
        invitedUserId: userToInvite.id,
        invitedEmail: inviteMemberDto.email,
      });

      // Get inviter and group details for email
      const [inviter, group] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: inviterId } }),
        this.prisma.group.findUnique({ where: { id: groupId } }),
      ]);

      if (inviter && group) {
        await this.mailService.sendGroupInvitation(
          inviteMemberDto.email,
          inviter.name,
          group.name,
          groupId,
        );
      }

      return updatedMembership;
    }

    // Create new invitation
    const newMember = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: userToInvite.id,
        role: GroupRole.MEMBER,
        status: InvitationStatus.PENDING,
        invitedById: inviterId,
        invitedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.logActivity(groupId, inviterId, 'MEMBER_INVITED', {
      invitedUserId: userToInvite.id,
      invitedEmail: inviteMemberDto.email,
    });

    // Get inviter and group details for email
    const [inviter, group] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: inviterId } }),
      this.prisma.group.findUnique({ where: { id: groupId } }),
    ]);

    if (inviter && group) {
      await this.mailService.sendGroupInvitation(
        inviteMemberDto.email,
        inviter.name,
        group.name,
        groupId,
      );
      // In-app notification for the invited user
      await this.notificationsService.createNotification(
        userToInvite.id,
        NotificationType.GROUP_INVITATION,
        `${inviter.name} invited you to "${group.name}"`,
        'Tap to view the invitation.',
        { groupId },
      );
    }

    return newMember;
  }

  async acceptInvitation(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!membership) {
      throw new NotFoundException('No pending invitation found for this group');
    }

    const now = new Date();
    const updatedMembership = await this.prisma.groupMember.update({
      where: { id: membership.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        respondedAt: now,
        joinedAt: now,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.logActivity(groupId, userId, 'INVITATION_ACCEPTED');

    return updatedMembership;
  }

  async declineInvitation(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!membership) {
      throw new NotFoundException('No pending invitation found for this group');
    }

    const updatedMembership = await this.prisma.groupMember.update({
      where: { id: membership.id },
      data: {
        status: InvitationStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    await this.logActivity(groupId, userId, 'INVITATION_DECLINED');

    return updatedMembership;
  }

  async getPendingInvitations(userId: string) {
    return this.prisma.groupMember.findMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
      },
      include: {
        group: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                members: {
                  where: { status: InvitationStatus.ACCEPTED },
                },
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });
  }

  // ─── Member Management ────────────────────────────────────

  async removeMember(
    groupId: string,
    removerId: string,
    memberToRemoveId: string,
  ) {
    // Check if remover has permission
    const removerMembership = await this.requireRole(groupId, removerId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    // Can't remove yourself if you're the last owner
    if (removerId === memberToRemoveId) {
      if (removerMembership.role === GroupRole.OWNER) {
        const ownerCount = await this.prisma.groupMember.count({
          where: {
            groupId,
            role: GroupRole.OWNER,
            status: InvitationStatus.ACCEPTED,
          },
        });
        if (ownerCount <= 1) {
          throw new BadRequestException(
            'Cannot remove the last owner. Transfer ownership first.',
          );
        }
      }
    }

    // Check if the member to remove has a higher or equal role
    const targetMembership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: memberToRemoveId,
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this group');
    }

    const roleHierarchy = ROLE_HIERARCHY;

    if (
      removerId !== memberToRemoveId &&
      roleHierarchy[targetMembership.role] >=
        roleHierarchy[removerMembership.role]
    ) {
      throw new ForbiddenException(
        'Cannot remove a member with equal or higher role',
      );
    }

    await this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberToRemoveId,
        },
      },
    });

    await this.logActivity(groupId, removerId, 'MEMBER_REMOVED', {
      removedUserId: memberToRemoveId,
    });

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(
    groupId: string,
    updaterId: string,
    targetUserId: string,
    newRole: GroupRole,
  ) {
    // OWNER can change any role, ADMIN can change roles of members below them
    const updaterMembership = await this.requireRole(groupId, updaterId, [
      GroupRole.OWNER,
      GroupRole.ADMIN,
    ]);

    // Can't change owner's own role via this method
    if (updaterId === targetUserId) {
      throw new BadRequestException(
        'Cannot change your own role. Transfer ownership instead.',
      );
    }

    const targetMembership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: targetUserId,
        status: InvitationStatus.ACCEPTED,
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Active member not found in this group');
    }

    const roleHierarchy = ROLE_HIERARCHY;

    if (
      updaterMembership.role === GroupRole.ADMIN &&
      roleHierarchy[targetMembership.role] >= roleHierarchy[GroupRole.ADMIN]
    ) {
      throw new ForbiddenException(
        'Admins cannot change the role of the Owner or other Admins',
      );
    }

    const updated = await this.prisma.groupMember.update({
      where: { id: targetMembership.id },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.logActivity(groupId, updaterId, 'ROLE_CHANGED', {
      targetUserId,
      oldRole: targetMembership.role,
      newRole,
    });

    return updated;
  }

  // ─── Group Itinerary Management ───────────────────────────

  async addItineraryToGroup(
    groupId: string,
    userId: string,
    itineraryId: string,
  ) {
    // Any accepted member can add itineraries
    await this.requireAcceptedMember(groupId, userId);

    // Check if itinerary exists and user owns it
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        userId,
      },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found or access denied');
    }

    // Check if itinerary is already in the group (active)
    const existingGroupItinerary = await this.prisma.groupItinerary.findFirst({
      where: { groupId, itineraryId },
    });

    if (existingGroupItinerary) {
      if (!existingGroupItinerary.deletedAt) {
        throw new BadRequestException('Itinerary is already in this group');
      }
      // Was previously removed — restore it
      const groupItinerary = await this.prisma.groupItinerary.update({
        where: { id: existingGroupItinerary.id },
        data: { deletedAt: null, addedById: userId, addedAt: new Date() },
        include: {
          itinerary: {
            select: {
              id: true,
              destination: true,
              startDate: true,
              endDate: true,
              travelType: true,
              totalDays: true,
              createdAt: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      });
      await this.logActivity(groupId, userId, 'ITINERARY_ADDED', {
        itineraryId,
        destination: itinerary.destination,
      }).catch(() => {});
      return groupItinerary;
    }

    const groupItinerary = await this.prisma.groupItinerary.create({
      data: {
        groupId,
        itineraryId,
        addedById: userId,
      },
      include: {
        itinerary: {
          select: {
            id: true,
            destination: true,
            startDate: true,
            endDate: true,
            travelType: true,
            totalDays: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.logActivity(groupId, userId, 'ITINERARY_ADDED', {
      itineraryId,
      destination: itinerary.destination,
    });

    return groupItinerary;
  }

  async removeItineraryFromGroup(
    groupId: string,
    userId: string,
    groupItineraryId: string,
  ) {
    await this.requireAcceptedMember(groupId, userId);

    const gi = await this.prisma.groupItinerary.findFirst({
      where: { id: groupItineraryId, groupId, deletedAt: null },
    });

    if (!gi) throw new NotFoundException('Itinerary not found in group');

    await this.prisma.groupItinerary.update({
      where: { id: groupItineraryId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Itinerary removed from group' };
  }

  // ─── Comments ─────────────────────────────────────────────

  async addComment(
    groupId: string,
    userId: string,
    addCommentDto: AddCommentDto,
  ) {
    await this.requireAcceptedMember(groupId, userId);

    // Validate parent comment if provided
    if (addCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: {
          id: addCommentDto.parentId,
          groupId,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        groupId,
        userId,
        content: addCommentDto.content,
        parentId: addCommentDto.parentId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.logActivity(groupId, userId, 'COMMENT_ADDED', {
      commentId: comment.id,
    });

    // Notify all group members except the commenter
    const [groupInfo, members] = await Promise.all([
      this.prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
      this.prisma.groupMember.findMany({
        where: { groupId, status: 'ACCEPTED', deletedAt: null, userId: { not: userId } },
        select: { userId: true },
      }),
    ]);
    const commenter = comment.user.name;
    await Promise.allSettled(
      members.map(m =>
        this.notificationsService.createNotification(
          m.userId,
          NotificationType.COMMENT,
          `${commenter} commented in "${groupInfo?.name}"`,
          comment.content.slice(0, 100),
          { groupId, commentId: comment.id },
        ),
      ),
    );

    return comment;
  }

  async getComments(groupId: string, userId: string) {
    await this.requireAcceptedMember(groupId, userId);

    const reactionSelect = {
      select: { emoji: true, userId: true },
    };

    return this.prisma.comment.findMany({
      where: { groupId, parentId: null, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        reactions: reactionSelect,
        replies: {
          where: { deletedAt: null },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            reactions: reactionSelect,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleReaction(
    groupId: string,
    commentId: string,
    userId: string,
    emoji: string,
  ) {
    await this.requireAcceptedMember(groupId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, groupId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentReaction.findUnique({
      where: { commentId_userId_emoji: { commentId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.commentReaction.delete({
        where: { commentId_userId_emoji: { commentId, userId, emoji } },
      });
      return { removed: true };
    }

    await this.prisma.commentReaction.create({
      data: { commentId, userId, emoji },
    });
    return { removed: false };
  }

  async getVotes(groupId: string, groupItineraryId: string, userId: string) {
    await this.requireAcceptedMember(groupId, userId);

    return this.prisma.vote.findMany({
      where: {
        groupItineraryId,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async voteForItinerary(
    groupId: string,
    groupItineraryId: string,
    userId: string,
    voteType: string,
  ) {
    await this.requireAcceptedMember(groupId, userId);

    // Check if group itinerary exists and belongs to the group
    const groupItinerary = await this.prisma.groupItinerary.findFirst({
      where: {
        id: groupItineraryId,
        groupId,
      },
    });

    if (!groupItinerary) {
      throw new NotFoundException('Group itinerary not found');
    }

    // Map vote type
    const mappedVoteType = voteType === 'DOWNVOTE' ? 'DOWNVOTE' : 'UPVOTE';

    // Upsert vote
    const vote = await this.prisma.vote.upsert({
      where: {
        groupItineraryId_userId: {
          groupItineraryId,
          userId,
        },
      },
      update: {
        voteType: mappedVoteType,
      },
      create: {
        groupItineraryId,
        userId,
        voteType: mappedVoteType,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify itinerary owner (not the voter)
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: groupItinerary.itineraryId },
      select: { userId: true, destination: true },
    });
    if (itinerary && itinerary.userId !== userId) {
      const voter = vote.user.name;
      await this.notificationsService.createNotification(
        itinerary.userId,
        NotificationType.VOTE,
        `${voter} voted on your "${itinerary.destination}" itinerary`,
        `${mappedVoteType === 'UPVOTE' ? '👍 Upvote' : '👎 Downvote'} in group`,
        { groupId, groupItineraryId, itineraryId: groupItinerary.itineraryId },
      ).catch(() => {});
    }

    return vote;
  }

  // ─── Activity Log ─────────────────────────────────────────

  async getGroupActivityLog(groupId: string, userId: string, limit = 50) {
    await this.requireAcceptedMember(groupId, userId);

    return this.prisma.activityLog.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  // ─── Private Helpers ──────────────────────────────────────

  private async requireAcceptedMember(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: InvitationStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an active member of this group',
      );
    }

    return membership;
  }

  private async requireRole(
    groupId: string,
    userId: string,
    requiredRoles: GroupRole[],
  ) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: InvitationStatus.ACCEPTED,
        role: { in: requiredRoles },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return membership;
  }

  private async logActivity(
    groupId: string,
    userId: string,
    action: string,
    details?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          groupId,
          userId,
          action,
          details: details
            ? (JSON.parse(JSON.stringify(details)) as object)
            : undefined,
        },
      });
    } catch (error) {
      // Activity logging should never break the main flow
      this.logger.warn(
        `Failed to log activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
