import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_SETTINGS = {
  groupInvitations: true,
  comments: true,
  votes: true,
  tripReminders: true,
  publicProfile: true,
  sharedItineraries: true,
  activityStatus: true,
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Upserts a user from Supabase Auth data.
   * This ensures that every authenticated user has a corresponding profile in our database.
   */
  async upsertUser(data: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    this.logger.log(`Upserting user: ${data.email} (${data.id})`);

    return this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        lastLoginAt: new Date(),
      },
      create: {
        id: data.id,
        email: data.email,
        name: data.name || '',
        avatarUrl: data.avatarUrl || null,
        lastLoginAt: new Date(),
      },
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
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

    return updatedUser;
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const meta = (user.metadata as Record<string, unknown>) ?? {};
    return { ...DEFAULT_SETTINGS, ...meta };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const current = (user.metadata as Record<string, unknown>) ?? {};
    const updated = { ...current, ...dto };
    await this.prisma.user.update({
      where: { id: userId },
      data: { metadata: updated },
    });
    return { ...DEFAULT_SETTINGS, ...updated };
  }

  async uploadAvatarFile(
    userId: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ avatarUrl: string }> {
    const client = this.supabase.getClient();
    if (!client) {
      throw new InternalServerErrorException('Storage service unavailable');
    }

    const ext = mimetype.split('/')[1] ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error } = await client.storage
      .from('avatars')
      .upload(path, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      this.logger.error(`Avatar upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload avatar');
    }

    const { data } = client.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = data.publicUrl;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async uploadAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${userId}@deleted.local`,
      },
    });

    const client = this.supabase.getClient();
    if (client) {
      await client.auth.admin.deleteUser(userId);
    }

    return { message: 'Account deleted successfully' };
  }
}
