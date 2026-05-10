import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        name: data.name || undefined,
        avatarUrl: data.avatarUrl || undefined,
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

    // Soft delete is handled by Prisma extension if configured, 
    // otherwise this will be a hard delete. 
    // In our case, PrismaService has a soft-delete extension.
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }
}
