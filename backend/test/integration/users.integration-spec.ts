import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { createTestUser } from '../test-data';
import { randomUUID } from 'crypto';

describe('UsersService (integration)', () => {
  let prisma: PrismaService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
      providers: [
        UsersService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              auth: {
                admin: {
                  deleteUser: jest.fn().mockResolvedValue({ error: null }),
                },
              },
            }),
          },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    usersService = moduleRef.get(UsersService);
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  describe('updateProfile Conflicts', () => {
    it('throws ConflictException when updating profile to an email that already exists', async () => {
      // 1. Create two users
      const user1 = await createTestUser(prisma);
      const user2 = await createTestUser(prisma);

      // 2. Try to update user1's email to user2's email
      await expect(
        usersService.updateProfile(user1.id, {
          email: user2.email,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when updating non-existent user profile', async () => {
      // Use a valid random UUID instead of "nonexistent-uuid" to prevent Postgres UUID syntax errors
      const fakeUuid = randomUUID();
      await expect(
        usersService.updateProfile(fakeUuid, {
          name: 'Anonymous',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings persistence', () => {
    it('correctly merges defaults and saves to metadata column', async () => {
      const user = await createTestUser(prisma);

      // Default settings check (metadata starts empty)
      expect(user.metadata).toEqual({});

      // Update settings using valid columns in DEFAULT_SETTINGS
      const updated = await usersService.updateSettings(user.id, {
        comments: false,
        votes: false,
      } as unknown as Parameters<typeof usersService.updateSettings>[1]);

      expect(updated.comments).toBe(false);
      expect(updated.votes).toBe(false);
      expect(updated.groupInvitations).toBe(true); // default value preserved

      // Verify DB persists it
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.metadata).toEqual({
        comments: false,
        votes: false,
      });
    });
  });
});
