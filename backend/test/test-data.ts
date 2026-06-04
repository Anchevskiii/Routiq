import { TravelType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestUserInput {
  id?: string;
  email?: string;
  name?: string;
}

export interface TestItineraryInput {
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelType?: TravelType;
  totalDays?: number;
}

export async function createTestUser(
  prisma: PrismaService,
  overrides: TestUserInput = {},
) {
  const id = overrides.id ?? randomUUID();
  const email =
    overrides.email ??
    `test-${Date.now()}-${randomBytes(4).toString('hex')}@example.com`;
  const name = overrides.name ?? 'Test User';

  return prisma.user.create({
    data: {
      id,
      email,
      name,
      avatarUrl: null,
    },
  });
}

export async function createTestItinerary(
  prisma: PrismaService,
  userId: string,
  overrides: TestItineraryInput = {},
) {
  const startDate = overrides.startDate ?? new Date('2026-06-01T00:00:00.000Z');
  const endDate = overrides.endDate ?? new Date('2026-06-03T00:00:00.000Z');

  return prisma.itinerary.create({
    data: {
      userId,
      destination: overrides.destination ?? 'Test City',
      startDate,
      endDate,
      travelType: overrides.travelType ?? TravelType.CULTURAL,
      totalDays: overrides.totalDays ?? 3,
    },
  });
}
