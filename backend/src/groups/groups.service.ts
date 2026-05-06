import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { GroupRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
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
        _count: {
          select: {
            members: true,
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
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
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
        itineraries: {
          include: {
            itinerary: {
              select: {
                id: true,
                destination: true,
                startDate: true,
                endDate: true,
                travelType: true,
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
            comments: {
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
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
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
      throw new NotFoundException('Group not found or access denied');
    }

    return group;
  }

  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        members: {
          create: {
            userId,
            role: GroupRole.ADMIN,
          },
        },
      },
      include: {
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

    return group;
  }

  async deleteGroup(groupId: string, userId: string) {
    // Check if user is admin of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only group admins can delete groups');
    }

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { message: 'Group deleted successfully' };
  }

  async inviteMember(
    groupId: string,
    userId: string,
    inviteMemberDto: InviteMemberDto,
  ) {
    // Check if user is admin of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only group admins can invite members');
    }

    // Check if the user to invite exists
    const userToInvite = await this.prisma.user.findUnique({
      where: { email: inviteMemberDto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: userToInvite.id,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this group');
    }

    // Add the user to the group
    const newMember = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: userToInvite.id,
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

    return newMember;
  }

  async removeMember(
    groupId: string,
    userId: string,
    memberToRemoveId: string,
  ) {
    // Check if user is admin of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: GroupRole.ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only group admins can remove members');
    }

    // Don't allow removing the last admin
    const adminCount = await this.prisma.groupMember.count({
      where: {
        groupId,
        role: GroupRole.ADMIN,
      },
    });

    const memberToRemove = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: memberToRemoveId,
        role: GroupRole.ADMIN,
      },
    });

    if (memberToRemove && adminCount <= 1) {
      throw new BadRequestException(
        'Cannot remove the last admin from the group',
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

    return { message: 'Member removed successfully' };
  }

  async addItineraryToGroup(
    groupId: string,
    userId: string,
    itineraryId: string,
  ) {
    // Check if user is member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the group to add itineraries',
      );
    }

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

    // Check if itinerary is already in the group
    const existingGroupItinerary = await this.prisma.groupItinerary.findFirst({
      where: {
        groupId,
        itineraryId,
      },
    });

    if (existingGroupItinerary) {
      throw new BadRequestException('Itinerary is already in this group');
    }

    const groupItinerary = await this.prisma.groupItinerary.create({
      data: {
        groupId,
        itineraryId,
      },
      include: {
        itinerary: {
          select: {
            id: true,
            destination: true,
            startDate: true,
            endDate: true,
            travelType: true,
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

    return groupItinerary;
  }

  async voteForAttraction(
    groupId: string,
    groupItineraryId: string,
    userId: string,
    attractionId: string,
  ) {
    // Check if user is member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member of the group to vote');
    }

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

    // Create or update vote
    const vote = await this.prisma.vote.upsert({
      where: {
        groupItineraryId_userId_attractionId: {
          groupItineraryId,
          userId,
          attractionId,
        },
      },
      update: {},
      create: {
        groupItineraryId,
        userId,
        attractionId,
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

    return vote;
  }

  async addComment(
    groupId: string,
    groupItineraryId: string,
    userId: string,
    addCommentDto: AddCommentDto,
  ) {
    // Check if user is member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a member of the group to comment',
      );
    }

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

    const comment = await this.prisma.comment.create({
      data: {
        groupItineraryId,
        userId,
        content: addCommentDto.content,
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

    return comment;
  }
}
