import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SupabaseClient } from '@supabase/supabase-js';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
};

const mockStorageBucket = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockSupabaseClient = {
  storage: {
    from: jest.fn(() => mockStorageBucket),
  },
  auth: {
    admin: {
      deleteUser: jest.fn(),
    },
  },
};

const mockSupabaseService = {
  getClient: jest.fn<SupabaseClient | undefined, []>(
    () => mockSupabaseClient as unknown as SupabaseClient,
  ),
};

function buildService() {
  return new UsersService(
    mockPrisma as unknown as PrismaService,
    mockSupabaseService as unknown as SupabaseService,
  );
}

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseService.getClient.mockReturnValue(
      mockSupabaseClient as unknown as SupabaseClient,
    );
    service = buildService();
  });

  describe('upsertUser', () => {
    it('creates a new user with defaults and updates lastLoginAt on update', async () => {
      mockPrisma.user.upsert.mockResolvedValue({ id: 'user-1' });

      await service.upsertUser({ id: 'user-1', email: 'test@example.com' });

      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        update: {
          email: 'test@example.com',
          lastLoginAt: expect.any(Date),
        },
        create: {
          id: 'user-1',
          email: 'test@example.com',
          name: '',
          avatarUrl: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('throws NotFoundException when user is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing', { name: 'New' } as UpdateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'a@b.com' })
        .mockResolvedValueOnce({ id: 'user-2', email: 'new@b.com' });

      await expect(
        service.updateProfile('user-1', {
          email: 'new@b.com',
        } as UpdateProfileDto),
      ).rejects.toThrow(ConflictException);
    });

    it('updates the profile when valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.updateProfile('user-1', {
        name: 'Alice',
      } as UpdateProfileDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Alice' },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({ id: 'user-1' });
    });
  });

  describe('getSettings', () => {
    it('throws NotFoundException when user is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getSettings('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('merges defaults with stored metadata', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: { comments: false, votes: false },
      });

      const result = await service.getSettings('user-1');

      expect(result).toEqual({
        groupInvitations: true,
        comments: false,
        votes: false,
        tripReminders: true,
        publicProfile: true,
        sharedItineraries: true,
        activityStatus: true,
      });
    });

    it('uses defaults when metadata is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: null,
      });

      const result = await service.getSettings('user-1');

      expect(result).toEqual({
        groupInvitations: true,
        comments: true,
        votes: true,
        tripReminders: true,
        publicProfile: true,
        sharedItineraries: true,
        activityStatus: true,
      });
    });
  });

  describe('updateSettings', () => {
    it('throws NotFoundException when user is missing during update', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSettings('missing', {} as UpdateSettingsDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('merges defaults and updates metadata', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: { comments: true, votes: true },
      });

      const result = await service.updateSettings('user-1', {
        comments: false,
      } as UpdateSettingsDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { metadata: { comments: false, votes: true } },
      });
      expect(result).toEqual({
        groupInvitations: true,
        comments: false,
        votes: true,
        tripReminders: true,
        publicProfile: true,
        sharedItineraries: true,
        activityStatus: true,
      });
    });

    it('uses defaults when metadata is null during update', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        metadata: null,
      });

      await service.updateSettings('user-1', {
        comments: false,
      } as UpdateSettingsDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { metadata: { comments: false } },
      });
    });
  });

  describe('uploadAvatarFile', () => {
    it('throws when storage is unavailable', async () => {
      mockSupabaseService.getClient.mockReturnValue(undefined);

      await expect(
        service.uploadAvatarFile('user-1', Buffer.from('x'), 'image/png'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws when upload fails', async () => {
      mockStorageBucket.upload.mockResolvedValue({
        error: { message: 'Upload failed' },
      });

      await expect(
        service.uploadAvatarFile('user-1', Buffer.from('x'), 'image/png'),
      ).rejects.toThrow('Failed to upload avatar');
    });

    it('defaults extension to jpg when mimetype is simple or missing subtype', async () => {
      mockStorageBucket.upload.mockResolvedValue({ error: null });
      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://cdn.example.com/avatar.jpg' },
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      await service.uploadAvatarFile('user-1', Buffer.from('x'), 'image');
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.stringContaining('avatar.jpg'),
        expect.any(Buffer),
        expect.any(Object),
      );
    });

    it('uploads and stores the public avatar URL', async () => {
      mockStorageBucket.upload.mockResolvedValue({ error: null });
      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://cdn.example.com/avatar.png' },
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.uploadAvatarFile(
        'user-1',
        Buffer.from('x'),
        'image/png',
      );

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('avatars');
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        'user-1/avatar.png',
        Buffer.from('x'),
        { contentType: 'image/png', upsert: true },
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://cdn.example.com/avatar.png' },
      });
      expect(result).toEqual({
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });
    });
  });

  describe('deleteAccount', () => {
    it('throws NotFoundException when user is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates user and deletes from Supabase when available', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.deleteAccount('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          deletedAt: expect.any(Date),
          email: 'deleted_user-1@deleted.local',
        },
      });
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('calls prisma.user.findUnique with the given id and correct select', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        metadata: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          metadata: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(user);
    });

    it('returns null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // findByEmail
  // =========================================================================

  describe('findByEmail', () => {
    it('calls prisma.user.findUnique with the given email', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('returns null when user is not found by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // uploadAvatar
  // =========================================================================

  describe('uploadAvatar', () => {
    it('updates and returns avatarUrl when user exists', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://cdn.example.com/avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.uploadAvatar(
        'user-1',
        'https://cdn.example.com/avatar.png',
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://cdn.example.com/avatar.png' },
        select: expect.objectContaining({ id: true, email: true }),
      });
      expect(result).toMatchObject({
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAvatar('nonexistent', 'https://cdn.example.com/x.png'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
