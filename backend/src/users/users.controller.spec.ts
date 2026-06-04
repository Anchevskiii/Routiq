import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'authenticated',
    user_metadata: {},
    app_metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = {
      findById: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      updateProfile: jest.fn(),
      uploadAvatarFile: jest.fn(),
      deleteAccount: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    controller = new UsersController(service);
  });

  describe('getProfile', () => {
    it('should return user profile using user ID', async () => {
      const mockProfile = { id: 'user-123', name: 'Alice' };
      service.findById.mockResolvedValue(
        mockProfile as unknown as Awaited<ReturnType<UsersService['findById']>>,
      );

      const result = await controller.getProfile(mockUser);
      expect(service.findById).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockProfile);
    });
  });

  describe('getSettings', () => {
    it('should return user settings using user ID', async () => {
      const mockSettings = { id: 'settings-123', groupInvitations: true };
      service.getSettings.mockResolvedValue(
        mockSettings as unknown as Awaited<
          ReturnType<UsersService['getSettings']>
        >,
      );

      const result = await controller.getSettings(mockUser);
      expect(service.getSettings).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update and return user settings', async () => {
      const dto: UpdateSettingsDto = { groupInvitations: true };
      const mockSettings = { id: 'settings-123', groupInvitations: true };
      service.updateSettings.mockResolvedValue(
        mockSettings as unknown as Awaited<
          ReturnType<UsersService['updateSettings']>
        >,
      );

      const result = await controller.updateSettings(mockUser, dto);
      expect(service.updateSettings).toHaveBeenCalledWith('user-123', dto);
      expect(result).toBe(mockSettings);
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile', async () => {
      const dto: UpdateProfileDto = { name: 'Alice Smith' };
      const mockProfile = { id: 'user-123', name: 'Alice Smith' };
      service.updateProfile.mockResolvedValue(
        mockProfile as unknown as Awaited<
          ReturnType<UsersService['updateProfile']>
        >,
      );

      const result = await controller.updateProfile(mockUser, dto);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', dto);
      expect(result).toBe(mockProfile);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar and return response', async () => {
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 100,
        buffer: Buffer.from('test-image'),
      };
      const mockUploadResponse = { avatarUrl: 'http://avatar.url' };
      service.uploadAvatarFile.mockResolvedValue(
        mockUploadResponse as unknown as Awaited<
          ReturnType<UsersService['uploadAvatarFile']>
        >,
      );

      const result = await controller.uploadAvatar(
        mockUser,
        mockFile as unknown as Parameters<UsersController['uploadAvatar']>[1],
      );
      expect(service.uploadAvatarFile).toHaveBeenCalledWith(
        'user-123',
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(result).toBe(mockUploadResponse);
    });
  });

  describe('deleteAccount', () => {
    it('should soft-delete user account and return success', async () => {
      const mockDeleteResponse = { success: true };
      service.deleteAccount.mockResolvedValue(
        mockDeleteResponse as unknown as Awaited<
          ReturnType<UsersService['deleteAccount']>
        >,
      );

      const result = await controller.deleteAccount(mockUser);
      expect(service.deleteAccount).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockDeleteResponse);
    });
  });
});
