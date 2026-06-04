import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupRole, InvitationStatus } from '@prisma/client';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { JwtPayload } from '../common/types/jwt-payload.type';

// ---------------------------------------------------------------------------
// Mock service
// ---------------------------------------------------------------------------

const mockGroupsService = {
  getUserGroups: jest.fn(),
  getPendingInvitations: jest.fn(),
  getGroupById: jest.fn(),
  getGroupActivityLog: jest.fn(),
  createGroup: jest.fn(),
  deleteGroup: jest.fn(),
  inviteMember: jest.fn(),
  acceptInvitation: jest.fn(),
  declineInvitation: jest.fn(),
  removeMember: jest.fn(),
  updateMemberRole: jest.fn(),
  addItineraryToGroup: jest.fn(),
  getComments: jest.fn(),
  getVotes: jest.fn(),
  voteForItinerary: jest.fn(),
  addComment: jest.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser: JwtPayload = {
  sub: 'user-123',
  email: 'test@example.com',
  role: 'authenticated',
  user_metadata: {},
  app_metadata: {},
};

const groupId = 'group-abc';
const groupItineraryId = 'gi-xyz';
const memberId = 'member-uid';

const mockGroup = {
  id: groupId,
  name: 'Paris Trip',
  description: 'Planning Paris',
  createdById: mockUser.sub,
  memberCount: 1,
  itineraryCount: 0,
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GroupsController', () => {
  let controller: GroupsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GroupsController(
      mockGroupsService as unknown as GroupsService,
    );
  });

  // =========================================================================
  // getUserGroups
  // =========================================================================

  describe('getUserGroups', () => {
    it('delegates to service with user.sub and returns result', async () => {
      mockGroupsService.getUserGroups.mockResolvedValue([mockGroup]);

      const result = await controller.getUserGroups(mockUser);

      expect(mockGroupsService.getUserGroups).toHaveBeenCalledWith(
        mockUser.sub,
      );
      expect(result).toEqual([mockGroup]);
    });

    it('returns an empty array when user has no groups', async () => {
      mockGroupsService.getUserGroups.mockResolvedValue([]);
      const result = await controller.getUserGroups(mockUser);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getPendingInvitations
  // =========================================================================

  describe('getPendingInvitations', () => {
    it('returns pending invitations for the user', async () => {
      const invitations = [{ id: 'inv-1', status: InvitationStatus.PENDING }];
      mockGroupsService.getPendingInvitations.mockResolvedValue(invitations);

      const result = await controller.getPendingInvitations(mockUser);

      expect(mockGroupsService.getPendingInvitations).toHaveBeenCalledWith(
        mockUser.sub,
      );
      expect(result).toEqual(invitations);
    });
  });

  // =========================================================================
  // getGroupById
  // =========================================================================

  describe('getGroupById', () => {
    it('returns the group for a valid member', async () => {
      mockGroupsService.getGroupById.mockResolvedValue(mockGroup);

      const result = await controller.getGroupById(groupId, mockUser);

      expect(mockGroupsService.getGroupById).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
      );
      expect(result).toEqual(mockGroup);
    });

    it('surfaces ForbiddenException from service', async () => {
      mockGroupsService.getGroupById.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(controller.getGroupById(groupId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('surfaces NotFoundException from service', async () => {
      mockGroupsService.getGroupById.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(
        controller.getGroupById('nonexistent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getGroupActivityLog
  // =========================================================================

  describe('getGroupActivityLog', () => {
    it('passes default limit of 50 when query param is absent', async () => {
      mockGroupsService.getGroupActivityLog.mockResolvedValue([]);

      await controller.getGroupActivityLog(groupId, mockUser, undefined);

      expect(mockGroupsService.getGroupActivityLog).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        50,
      );
    });

    it('parses string limit query param into a number', async () => {
      mockGroupsService.getGroupActivityLog.mockResolvedValue([]);

      await controller.getGroupActivityLog(groupId, mockUser, '25');

      expect(mockGroupsService.getGroupActivityLog).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        25,
      );
    });
  });

  // =========================================================================
  // createGroup
  // =========================================================================

  describe('createGroup', () => {
  const createDto = { name: 'My Group', description: 'desc' };

  it('creates a group and returns it', async () => {
    mockGroupsService.createGroup.mockResolvedValue(mockGroup);

    const result = await controller.createGroup(mockUser, createDto, undefined);

    expect(mockGroupsService.createGroup).toHaveBeenCalledWith(
      mockUser.sub,
      createDto,
      undefined,
      undefined,
    );
    expect(result).toEqual(mockGroup);
  });
});

  // =========================================================================
  // deleteGroup
  // =========================================================================

  describe('deleteGroup', () => {
    it('deletes the group and returns success message', async () => {
      mockGroupsService.deleteGroup.mockResolvedValue({
        message: 'Group deleted successfully',
      });

      const result = await controller.deleteGroup(groupId, mockUser);

      expect(mockGroupsService.deleteGroup).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
      );
      expect(result).toEqual({ message: 'Group deleted successfully' });
    });

    it('surfaces ForbiddenException when caller is not OWNER', async () => {
      mockGroupsService.deleteGroup.mockRejectedValue(new ForbiddenException());

      await expect(controller.deleteGroup(groupId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =========================================================================
  // inviteMember
  // =========================================================================

  describe('inviteMember', () => {
    const inviteDto = { email: 'invite@example.com' };

    it('invites a member and returns the new membership record', async () => {
      const newMembership = {
        id: 'mem-new',
        status: InvitationStatus.PENDING,
        user: { id: 'new-uid', email: 'invite@example.com' },
      };
      mockGroupsService.inviteMember.mockResolvedValue(newMembership);

      const result = await controller.inviteMember(
        groupId,
        mockUser,
        inviteDto,
      );

      expect(mockGroupsService.inviteMember).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        inviteDto,
      );
      expect(result.status).toBe(InvitationStatus.PENDING);
    });

    it('surfaces BadRequestException when user is already a member', async () => {
      mockGroupsService.inviteMember.mockRejectedValue(
        new BadRequestException('User is already a member'),
      );

      await expect(
        controller.inviteMember(groupId, mockUser, inviteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('surfaces NotFoundException when invited user does not exist', async () => {
      mockGroupsService.inviteMember.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.inviteMember(groupId, mockUser, { email: 'ghost@x.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // acceptInvitation / declineInvitation
  // =========================================================================

  describe('acceptInvitation', () => {
    it('accepts the invitation and returns updated membership', async () => {
      const accepted = { id: 'mem-1', status: InvitationStatus.ACCEPTED };
      mockGroupsService.acceptInvitation.mockResolvedValue(accepted);

      const result = await controller.acceptInvitation(groupId, mockUser);

      expect(mockGroupsService.acceptInvitation).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
      );
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
    });

    it('surfaces NotFoundException when no pending invitation exists', async () => {
      mockGroupsService.acceptInvitation.mockRejectedValue(
        new NotFoundException('No pending invitation found'),
      );

      await expect(
        controller.acceptInvitation(groupId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('declineInvitation', () => {
    it('declines the invitation', async () => {
      const declined = { id: 'mem-1', status: InvitationStatus.DECLINED };
      mockGroupsService.declineInvitation.mockResolvedValue(declined);

      const result = await controller.declineInvitation(groupId, mockUser);

      expect(mockGroupsService.declineInvitation).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
      );
      expect(result.status).toBe(InvitationStatus.DECLINED);
    });
  });

  // =========================================================================
  // removeMember
  // =========================================================================

  describe('removeMember', () => {
    it('removes the member and returns success', async () => {
      mockGroupsService.removeMember.mockResolvedValue({
        message: 'Member removed successfully',
      });

      const result = await controller.removeMember(groupId, memberId, mockUser);

      expect(mockGroupsService.removeMember).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        memberId,
      );
      expect(result).toEqual({ message: 'Member removed successfully' });
    });

    it('surfaces ForbiddenException when caller has insufficient role', async () => {
      mockGroupsService.removeMember.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        controller.removeMember(groupId, memberId, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // updateMemberRole
  // =========================================================================

  describe('updateMemberRole', () => {
    it('updates the role and returns the updated membership', async () => {
      const updated = {
        id: 'mem-1',
        role: GroupRole.ADMIN,
        user: { id: memberId },
      };
      mockGroupsService.updateMemberRole.mockResolvedValue(updated);

      const result = await controller.updateMemberRole(
        groupId,
        memberId,
        mockUser,
        { role: GroupRole.ADMIN },
      );

      expect(mockGroupsService.updateMemberRole).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        memberId,
        GroupRole.ADMIN,
      );
      expect(result.role).toBe(GroupRole.ADMIN);
    });

    it('surfaces BadRequestException when owner tries to change own role', async () => {
      mockGroupsService.updateMemberRole.mockRejectedValue(
        new BadRequestException('Cannot change your own role'),
      );

      await expect(
        controller.updateMemberRole(groupId, mockUser.sub, mockUser, {
          role: GroupRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // addItineraryToGroup
  // =========================================================================

  describe('addItineraryToGroup', () => {
    const addDto = { itineraryId: 'itin-789' };

    it('adds the itinerary to the group', async () => {
      const gi = {
        id: groupItineraryId,
        groupId,
        itineraryId: addDto.itineraryId,
      };
      mockGroupsService.addItineraryToGroup.mockResolvedValue(gi);

      const result = await controller.addItineraryToGroup(
        groupId,
        mockUser,
        addDto,
      );

      expect(mockGroupsService.addItineraryToGroup).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        addDto.itineraryId,
      );
      expect(result).toEqual(gi);
    });

    it('surfaces BadRequestException when itinerary is already in the group', async () => {
      mockGroupsService.addItineraryToGroup.mockRejectedValue(
        new BadRequestException('Itinerary is already in this group'),
      );

      await expect(
        controller.addItineraryToGroup(groupId, mockUser, addDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // getComments
  // =========================================================================

  describe('getComments', () => {
    it('returns comments for a group', async () => {
      const comments = [{ id: 'c1', content: 'Nice!', replies: [] }];
      mockGroupsService.getComments.mockResolvedValue(comments);

      const result = await controller.getComments(groupId, mockUser);

      expect(mockGroupsService.getComments).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
      );
      expect(result).toEqual(comments);
    });

    it('surfaces ForbiddenException for non-members', async () => {
      mockGroupsService.getComments.mockRejectedValue(new ForbiddenException());

      await expect(controller.getComments(groupId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =========================================================================
  // getVotes
  // =========================================================================

  describe('getVotes', () => {
    it('returns votes for a group itinerary', async () => {
      const votes = [{ id: 'v1', voteType: 'UPVOTE', user: {} }];
      mockGroupsService.getVotes.mockResolvedValue(votes);

      const result = await controller.getVotes(
        groupId,
        groupItineraryId,
        mockUser,
      );

      expect(mockGroupsService.getVotes).toHaveBeenCalledWith(
        groupId,
        groupItineraryId,
        mockUser.sub,
      );
      expect(result).toEqual(votes);
    });
  });

  // =========================================================================
  // voteForItinerary
  // =========================================================================

  describe('voteForItinerary', () => {
    const voteDto = { voteType: 'UPVOTE' };

    it('registers an UPVOTE', async () => {
      const vote = { id: 'vote-1', voteType: 'UPVOTE', user: {} };
      mockGroupsService.voteForItinerary.mockResolvedValue(vote);

      const result = await controller.voteForItinerary(
        groupId,
        groupItineraryId,
        mockUser,
        voteDto,
      );

      expect(mockGroupsService.voteForItinerary).toHaveBeenCalledWith(
        groupId,
        groupItineraryId,
        mockUser.sub,
        voteDto.voteType,
      );
      expect(result.voteType).toBe('UPVOTE');
    });

    it('uses UPVOTE as default when voteType is not provided', async () => {
      const vote = { id: 'vote-1', voteType: 'UPVOTE', user: {} };
      mockGroupsService.voteForItinerary.mockResolvedValue(vote);

      await controller.voteForItinerary(
        groupId,
        groupItineraryId,
        mockUser,
        {},
      );

      expect(mockGroupsService.voteForItinerary).toHaveBeenCalledWith(
        groupId,
        groupItineraryId,
        mockUser.sub,
        'UPVOTE',
      );
    });

    it('surfaces ForbiddenException for non-members', async () => {
      mockGroupsService.voteForItinerary.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        controller.voteForItinerary(
          groupId,
          groupItineraryId,
          mockUser,
          voteDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // addComment
  // =========================================================================

  describe('addComment', () => {
    const commentDto = { content: 'Great plan!' };

    it('adds a comment and returns it', async () => {
      const comment = {
        id: 'c1',
        content: 'Great plan!',
        parentId: null,
        user: {},
        replies: [],
      };
      mockGroupsService.addComment.mockResolvedValue(comment);

      const result = await controller.addComment(groupId, mockUser, commentDto);

      expect(mockGroupsService.addComment).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        commentDto,
      );
      expect(result.content).toBe('Great plan!');
    });

    it('surfaces NotFoundException when group itinerary is not found', async () => {
      mockGroupsService.addComment.mockRejectedValue(
        new NotFoundException('Group itinerary not found'),
      );

      await expect(
        controller.addComment(groupId, mockUser, commentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
