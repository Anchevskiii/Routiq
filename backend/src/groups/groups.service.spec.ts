import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupRole, InvitationStatus } from '@prisma/client';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------

const mockPrisma = {
  group: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  groupMember: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  groupItinerary: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  itinerary: {
    findFirst: jest.fn(),
  },
  vote: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  comment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ownerId = 'owner-uid';
const adminId = 'admin-uid';
const memberId = 'member-uid';
const outsiderId = 'outsider-uid';
const groupId = 'group-123';
const itineraryId = 'itin-456';
const groupItineraryId = 'gi-789';

const ownerMembership = {
  id: 'mem-1',
  groupId,
  userId: ownerId,
  role: GroupRole.OWNER,
  status: InvitationStatus.ACCEPTED,
};

const adminMembership = {
  id: 'mem-2',
  groupId,
  userId: adminId,
  role: GroupRole.ADMIN,
  status: InvitationStatus.ACCEPTED,
};

const regularMembership = {
  id: 'mem-3',
  groupId,
  userId: memberId,
  role: GroupRole.MEMBER,
  status: InvitationStatus.ACCEPTED,
};

const pendingMembership = {
  id: 'mem-pending',
  groupId,
  userId: memberId,
  role: GroupRole.MEMBER,
  status: InvitationStatus.PENDING,
};

const groupRecord = {
  id: groupId,
  name: 'Test Group',
  description: 'A group for testing',
  createdById: ownerId,
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function buildService(): GroupsService {
  return new GroupsService(mockPrisma as unknown as PrismaService);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GroupsService', () => {
  let service: GroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.activityLog.create.mockResolvedValue({});
    service = buildService();
  });

  // =========================================================================
  // getUserGroups
  // =========================================================================

  describe('getUserGroups', () => {
    it('returns groups enriched with memberCount and itineraryCount', async () => {
      const rawGroups = [
        {
          ...groupRecord,
          createdBy: { id: ownerId, name: 'Owner', avatarUrl: null },
          members: [],
          _count: { members: 3, itineraries: 2 },
        },
      ];
      mockPrisma.group.findMany.mockResolvedValue(rawGroups);

      const result = await service.getUserGroups(ownerId);

      expect(result).toHaveLength(1);
      expect(result[0].memberCount).toBe(3);
      expect(result[0].itineraryCount).toBe(2);
      expect(mockPrisma.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: { userId: ownerId, status: InvitationStatus.ACCEPTED },
            },
          },
        }),
      );
    });

    it('returns an empty array when user is in no groups', async () => {
      mockPrisma.group.findMany.mockResolvedValue([]);
      const result = await service.getUserGroups(ownerId);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getGroupById
  // =========================================================================

  describe('getGroupById', () => {
    it('returns the group when user is an accepted member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.group.findFirst.mockResolvedValue(groupRecord);

      const result = await service.getGroupById(groupId, memberId);

      expect(result).toEqual(groupRecord);
    });

    it('throws ForbiddenException when user is not an accepted member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getGroupById(groupId, outsiderId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when group does not exist', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.group.findFirst.mockResolvedValue(null);

      await expect(
        service.getGroupById(groupId, memberId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // createGroup
  // =========================================================================

  describe('createGroup', () => {
    it('creates a group with the creator as OWNER and logs GROUP_CREATED', async () => {
      const created = {
        ...groupRecord,
        createdBy: { id: ownerId, name: 'Owner', avatarUrl: null },
        members: [ownerMembership],
      };
      mockPrisma.group.create.mockResolvedValue(created);

      const result = await service.createGroup(ownerId, {
        name: 'Test Group',
        description: 'desc',
      });

      expect(mockPrisma.group.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Group',
            createdById: ownerId,
            members: {
              create: expect.objectContaining({
                userId: ownerId,
                role: GroupRole.OWNER,
                status: InvitationStatus.ACCEPTED,
              }),
            },
          }),
        }),
      );
      expect(result).toEqual(created);
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'GROUP_CREATED' }),
        }),
      );
    });
  });

  // =========================================================================
  // deleteGroup
  // =========================================================================

  describe('deleteGroup', () => {
    it('deletes the group when caller is OWNER', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(ownerMembership);
      mockPrisma.group.delete.mockResolvedValue(groupRecord);

      const result = await service.deleteGroup(groupId, ownerId);

      expect(mockPrisma.group.delete).toHaveBeenCalledWith({
        where: { id: groupId },
      });
      expect(result).toEqual({ message: 'Group deleted successfully' });
    });

    it('throws ForbiddenException when caller is not OWNER', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteGroup(groupId, adminId),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.group.delete).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // inviteMember
  // =========================================================================

  describe('inviteMember', () => {
    // Service call order:
    //   1. requireRole → groupMember.findFirst (inviter role check)
    //   2. user.findUnique (find the user to invite)
    //   3. groupMember.findFirst (existing membership check)

    const inviteDto = { email: 'new@example.com' };
    const newUser = { id: 'new-user-id', email: 'new@example.com' };

    it('creates a new PENDING invitation and logs MEMBER_INVITED', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership) // 1. requireRole ok
        .mockResolvedValueOnce(null);           // 3. no existing membership
      mockPrisma.user.findUnique.mockResolvedValue(newUser);
      mockPrisma.groupMember.create.mockResolvedValue({
        id: 'new-mem',
        userId: newUser.id,
        groupId,
        role: GroupRole.MEMBER,
        status: InvitationStatus.PENDING,
        user: newUser,
      });

      const result = await service.inviteMember(groupId, adminId, inviteDto);

      expect(mockPrisma.groupMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupId,
            userId: newUser.id,
            role: GroupRole.MEMBER,
            status: InvitationStatus.PENDING,
            invitedById: adminId,
          }),
        }),
      );
      expect(result.status).toBe(InvitationStatus.PENDING);
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'MEMBER_INVITED' }),
        }),
      );
    });

    it('throws NotFoundException when the invited user does not exist', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(adminMembership); // 1. requireRole
      mockPrisma.user.findUnique.mockResolvedValue(null);                      // 2. user not found

      await expect(
        service.inviteMember(groupId, adminId, inviteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user is already an accepted member', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership)                                   // 1. requireRole
        .mockResolvedValueOnce({ ...regularMembership, userId: newUser.id,
                                  status: InvitationStatus.ACCEPTED });           // 3. already member
      mockPrisma.user.findUnique.mockResolvedValue(newUser);

      await expect(
        service.inviteMember(groupId, adminId, inviteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user already has a pending invitation', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership)                                   // 1. requireRole
        .mockResolvedValueOnce({ ...regularMembership, userId: newUser.id,
                                  status: InvitationStatus.PENDING });            // 3. already pending
      mockPrisma.user.findUnique.mockResolvedValue(newUser);

      await expect(
        service.inviteMember(groupId, adminId, inviteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('re-invites when previous invitation was declined', async () => {
      const declinedMembership = {
        id: 'mem-declined',
        userId: newUser.id,
        groupId,
        role: GroupRole.MEMBER,
        status: InvitationStatus.DECLINED,
      };
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership)    // 1. requireRole
        .mockResolvedValueOnce(declinedMembership); // 3. declined → re-invite path
      mockPrisma.user.findUnique.mockResolvedValue(newUser);
      mockPrisma.groupMember.update.mockResolvedValue({
        ...declinedMembership,
        status: InvitationStatus.PENDING,
        user: newUser,
      });

      const result = await service.inviteMember(groupId, adminId, inviteDto);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: declinedMembership.id },
          data: expect.objectContaining({ status: InvitationStatus.PENDING }),
        }),
      );
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'MEMBER_RE_INVITED' }),
        }),
      );
      expect(result.status).toBe(InvitationStatus.PENDING);
    });

    it('throws ForbiddenException when inviter is a plain MEMBER', async () => {
      // requireRole(OWNER|ADMIN|MODERATOR) returns null → ForbiddenException immediately
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.inviteMember(groupId, memberId, inviteDto),
      ).rejects.toThrow(ForbiddenException);

      // Should not even look up the user to invite
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // acceptInvitation
  // =========================================================================

  describe('acceptInvitation', () => {
    // acceptInvitation has a single groupMember.findFirst call (PENDING lookup)

    it('sets status to ACCEPTED and records timestamps', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(pendingMembership);
      mockPrisma.groupMember.update.mockResolvedValue({
        ...pendingMembership,
        status: InvitationStatus.ACCEPTED,
        user: { id: memberId, name: 'Member', email: 'm@m.com', avatarUrl: null },
        group: { id: groupId, name: 'Test Group' },
      });

      const result = await service.acceptInvitation(groupId, memberId);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pendingMembership.id },
          data: expect.objectContaining({
            status: InvitationStatus.ACCEPTED,
            respondedAt: expect.any(Date),
            joinedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'INVITATION_ACCEPTED' }),
        }),
      );
    });

    it('throws NotFoundException when no pending invitation exists', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(groupId, memberId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // declineInvitation
  // =========================================================================

  describe('declineInvitation', () => {
    it('sets status to DECLINED', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(pendingMembership);
      mockPrisma.groupMember.update.mockResolvedValue({
        ...pendingMembership,
        status: InvitationStatus.DECLINED,
      });

      const result = await service.declineInvitation(groupId, memberId);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pendingMembership.id },
          data: expect.objectContaining({ status: InvitationStatus.DECLINED }),
        }),
      );
      expect(result.status).toBe(InvitationStatus.DECLINED);
    });

    it('throws NotFoundException when no pending invitation exists', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.declineInvitation(groupId, memberId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getPendingInvitations
  // =========================================================================

  describe('getPendingInvitations', () => {
    it('returns all pending invitations for the user', async () => {
      const invitations = [{ id: 'inv-1', status: InvitationStatus.PENDING }];
      mockPrisma.groupMember.findMany.mockResolvedValue(invitations);

      const result = await service.getPendingInvitations(memberId);

      expect(result).toEqual(invitations);
      expect(mockPrisma.groupMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: memberId, status: InvitationStatus.PENDING },
        }),
      );
    });
  });

  // =========================================================================
  // removeMember
  // =========================================================================

  describe('removeMember', () => {
    // removeMember call order:
    //   1. requireRole(OWNER|ADMIN) → groupMember.findFirst → remover membership
    //   2. if removerId === memberToRemoveId AND role === OWNER: groupMember.count
    //   3. groupMember.findFirst → target membership
    //   4. role hierarchy check
    //   5. groupMember.delete

    it('removes a lower-ranked member when caller is ADMIN', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership)    // 1. requireRole
        .mockResolvedValueOnce(regularMembership); // 3. target membership
      mockPrisma.groupMember.delete.mockResolvedValue(regularMembership);

      const result = await service.removeMember(groupId, adminId, memberId);

      expect(mockPrisma.groupMember.delete).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId, userId: memberId } },
      });
      expect(result).toEqual({ message: 'Member removed successfully' });
    });

    it('throws ForbiddenException when trying to remove a member with equal or higher role', async () => {
      // Admin (hierarchy 3) tries to remove another Admin (hierarchy 3)
      const otherAdmin = {
        ...adminMembership,
        id: 'mem-other-admin',
        userId: 'other-admin-uid',
      };
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership) // 1. requireRole → admin ok
        .mockResolvedValueOnce(otherAdmin);     // 3. target = also ADMIN → blocked

      await expect(
        service.removeMember(groupId, adminId, 'other-admin-uid'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.groupMember.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when sole OWNER tries to remove themselves', async () => {
      // removerId === memberToRemoveId AND role === OWNER → count check fires before target lookup
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(ownerMembership); // 1. requireRole
      mockPrisma.groupMember.count.mockResolvedValue(1);                       // 2. only 1 owner

      await expect(
        service.removeMember(groupId, ownerId, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when target member does not exist', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(adminMembership) // 1. requireRole
        .mockResolvedValueOnce(null);           // 3. target not found

      await expect(
        service.removeMember(groupId, adminId, 'ghost-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller lacks required role', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(null); // 1. requireRole fails

      await expect(
        service.removeMember(groupId, memberId, outsiderId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // updateMemberRole
  // =========================================================================

  describe('updateMemberRole', () => {
    // updateMemberRole call order:
    //   1. requireRole(OWNER) → groupMember.findFirst
    //   2. self-update check (sync, no DB call)
    //   3. groupMember.findFirst → target membership (with ACCEPTED status filter)
    //   4. groupMember.update

    it('updates the role of a target member when caller is OWNER', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(ownerMembership)    // 1. requireRole
        .mockResolvedValueOnce(regularMembership); // 3. target lookup
      const updated = { ...regularMembership, role: GroupRole.ADMIN, user: {} };
      mockPrisma.groupMember.update.mockResolvedValue(updated);

      const result = await service.updateMemberRole(
        groupId,
        ownerId,
        memberId,
        GroupRole.ADMIN,
      );

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: regularMembership.id },
          data: { role: GroupRole.ADMIN },
        }),
      );
      expect(result.role).toBe(GroupRole.ADMIN);
    });

    it('throws BadRequestException when OWNER tries to change their own role', async () => {
      // requireRole passes, then the synchronous self-update check throws
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(ownerMembership); // 1. requireRole

      await expect(
        service.updateMemberRole(groupId, ownerId, ownerId, GroupRole.MEMBER),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.groupMember.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target member is not found', async () => {
      mockPrisma.groupMember.findFirst
        .mockResolvedValueOnce(ownerMembership) // 1. requireRole
        .mockResolvedValueOnce(null);           // 3. target not found

      await expect(
        service.updateMemberRole(groupId, ownerId, 'ghost', GroupRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is not OWNER', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValueOnce(null); // 1. requireRole fails

      await expect(
        service.updateMemberRole(groupId, adminId, memberId, GroupRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // addItineraryToGroup
  // =========================================================================

  describe('addItineraryToGroup', () => {
    // addItineraryToGroup call order:
    //   1. requireAcceptedMember → groupMember.findFirst
    //   2. itinerary.findFirst (ownership check)
    //   3. groupItinerary.findFirst (duplicate check)
    //   4. groupItinerary.create

    const itinerary = { id: itineraryId, userId: memberId, destination: 'Paris' };

    it('adds an itinerary to the group when user is a member and owns the itinerary', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership); // 1. member ok
      mockPrisma.itinerary.findFirst.mockResolvedValue(itinerary);           // 2. owned
      mockPrisma.groupItinerary.findFirst.mockResolvedValue(null);           // 3. not duplicate
      mockPrisma.groupItinerary.create.mockResolvedValue({
        id: groupItineraryId,
        groupId,
        itineraryId,
        itinerary,
      });

      const result = await service.addItineraryToGroup(groupId, memberId, itineraryId);

      expect(mockPrisma.groupItinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ groupId, itineraryId, addedById: memberId }),
        }),
      );
      expect(result.itineraryId).toBe(itineraryId);
    });

    it('throws NotFoundException when itinerary does not belong to the user', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership); // 1. member ok
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);                // 2. not found/not owned

      await expect(
        service.addItineraryToGroup(groupId, memberId, 'other-itin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when itinerary is already in the group', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.itinerary.findFirst.mockResolvedValue(itinerary);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId }); // 3. duplicate

      await expect(
        service.addItineraryToGroup(groupId, memberId, itineraryId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not a member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null); // 1. not a member

      await expect(
        service.addItineraryToGroup(groupId, outsiderId, itineraryId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // voteForActivity
  // =========================================================================

  describe('voteForActivity', () => {
    // voteForActivity call order:
    //   1. requireAcceptedMember → groupMember.findFirst
    //   2. groupItinerary.findFirst

    const activityId = 'act-111';
    const baseVote = {
      id: 'vote-1',
      groupItineraryId,
      userId: memberId,
      activityId,
      voteType: 'UPVOTE',
      user: {},
    };

    it('upserts an UPVOTE for an accepted member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.vote.upsert.mockResolvedValue(baseVote);

      const result = await service.voteForActivity(
        groupId, groupItineraryId, memberId, activityId, 'UPVOTE',
      );

      expect(mockPrisma.vote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ groupItineraryId, userId: memberId, activityId, voteType: 'UPVOTE' }),
          update: { voteType: 'UPVOTE' },
        }),
      );
      expect(result.voteType).toBe('UPVOTE');
    });

    it('maps unknown voteType to UPVOTE', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.vote.upsert.mockResolvedValue(baseVote);

      await service.voteForActivity(groupId, groupItineraryId, memberId, activityId, 'INVALID');

      expect(mockPrisma.vote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ voteType: 'UPVOTE' }) }),
      );
    });

    it('upserts a DOWNVOTE correctly', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.vote.upsert.mockResolvedValue({ ...baseVote, voteType: 'DOWNVOTE' });

      const result = await service.voteForActivity(
        groupId, groupItineraryId, memberId, activityId, 'DOWNVOTE',
      );

      expect(mockPrisma.vote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { voteType: 'DOWNVOTE' } }),
      );
      expect(result.voteType).toBe('DOWNVOTE');
    });

    it('throws ForbiddenException for non-members', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.voteForActivity(groupId, groupItineraryId, outsiderId, activityId, 'UPVOTE'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when group itinerary does not exist', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.voteForActivity(groupId, 'bad-gi', memberId, activityId, 'UPVOTE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // addComment
  // =========================================================================

  describe('addComment', () => {
    // addComment call order:
    //   1. requireAcceptedMember → groupMember.findFirst
    //   2. groupItinerary.findFirst
    //   3. (only if parentId) comment.findFirst
    //   4. comment.create

    const addCommentDto = { content: 'Great itinerary!' };
    const commentRecord = {
      id: 'comment-1',
      groupItineraryId,
      userId: memberId,
      content: 'Great itinerary!',
      parentId: null,
      user: {},
      replies: [],
    };

    it('creates a top-level comment and logs COMMENT_ADDED', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.comment.create.mockResolvedValue(commentRecord);

      const result = await service.addComment(
        groupId, groupItineraryId, memberId, addCommentDto,
      );

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupItineraryId,
            userId: memberId,
            content: 'Great itinerary!',
            parentId: null,
          }),
        }),
      );
      expect(result.content).toBe('Great itinerary!');
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'COMMENT_ADDED' }),
        }),
      );
    });

    it('creates a threaded reply when parentId is provided and valid', async () => {
      const parentComment = { id: 'parent-1', groupItineraryId };
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.comment.findFirst.mockResolvedValue(parentComment); // 3. parent exists
      mockPrisma.comment.create.mockResolvedValue({ ...commentRecord, parentId: 'parent-1' });

      const result = await service.addComment(
        groupId, groupItineraryId, memberId,
        { content: 'Reply!', parentId: 'parent-1' },
      );

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parentId: 'parent-1' }),
        }),
      );
      expect(result.parentId).toBe('parent-1');
    });

    it('throws NotFoundException when parentId does not exist', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue({ id: groupItineraryId, groupId });
      mockPrisma.comment.findFirst.mockResolvedValue(null); // 3. parent not found

      await expect(
        service.addComment(groupId, groupItineraryId, memberId, {
          content: 'Reply!',
          parentId: 'ghost-parent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not a member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.addComment(groupId, groupItineraryId, outsiderId, addCommentDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when group itinerary is not in this group', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.groupItinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.addComment(groupId, 'bad-gi', memberId, addCommentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getComments
  // =========================================================================

  describe('getComments', () => {
    it('returns top-level comments for a member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      const comments = [{ id: 'c1', parentId: null, content: 'Hi', replies: [] }];
      mockPrisma.comment.findMany.mockResolvedValue(comments);

      const result = await service.getComments(groupId, groupItineraryId, memberId);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupItineraryId, parentId: null, deletedAt: null },
        }),
      );
      expect(result).toEqual(comments);
    });

    it('throws ForbiddenException for non-members', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getComments(groupId, groupItineraryId, outsiderId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // getVotes
  // =========================================================================

  describe('getVotes', () => {
    it('returns votes for a group itinerary when user is a member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      const votes = [{ id: 'v1', voteType: 'UPVOTE', user: {} }];
      mockPrisma.vote.findMany.mockResolvedValue(votes);

      const result = await service.getVotes(groupId, groupItineraryId, memberId);

      expect(mockPrisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupItineraryId, deletedAt: null } }),
      );
      expect(result).toEqual(votes);
    });

    it('throws ForbiddenException for non-members', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getVotes(groupId, groupItineraryId, outsiderId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // getGroupActivityLog
  // =========================================================================

  describe('getGroupActivityLog', () => {
    it('returns activity log entries for a member', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      const logs = [{ id: 'log-1', action: 'GROUP_CREATED', user: {} }];
      mockPrisma.activityLog.findMany.mockResolvedValue(logs);

      const result = await service.getGroupActivityLog(groupId, memberId, 50);

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupId }, take: 50 }),
      );
      expect(result).toEqual(logs);
    });

    it('defaults to limit 50 when not specified', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(regularMembership);
      mockPrisma.activityLog.findMany.mockResolvedValue([]);

      await service.getGroupActivityLog(groupId, memberId);

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('throws ForbiddenException for non-members', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getGroupActivityLog(groupId, outsiderId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // Activity log resilience
  // =========================================================================

  describe('activity log resilience', () => {
    it('does not propagate errors when logActivity fails', async () => {
      mockPrisma.group.create.mockResolvedValue({
        ...groupRecord,
        createdBy: {},
        members: [],
      });
      mockPrisma.activityLog.create.mockRejectedValue(new Error('DB write failed'));

      await expect(
        service.createGroup(ownerId, { name: 'New Group' }),
      ).resolves.toBeDefined();
    });
  });
});