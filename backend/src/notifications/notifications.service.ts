import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SETTING_KEY: Record<NotificationType, string> = {
  GROUP_INVITATION: 'groupInvitations',
  COMMENT:          'comments',
  VOTE:             'votes',
  TRIP_REMINDER:    'tripReminders',
};

const DEFAULT_SETTINGS: Record<string, boolean> = {
  groupInvitations: true,
  comments:         true,
  votes:            true,
  tripReminders:    true,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Create ───────────────────────────────────────────────────────────────────

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ) {
    // Respect user's notification settings stored in metadata
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    if (!user) return null;

    const meta = (user.metadata as Record<string, unknown>) ?? {};
    const settings = { ...DEFAULT_SETTINGS, ...meta };
    if (settings[SETTING_KEY[type]] === false) return null;

    return this.prisma.notification.create({
      data: { userId, type, title, body, data: data ?? {} },
    });
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { notifications, total, unread, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  // ── Mark read ─────────────────────────────────────────────────────────────────

  async markRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  // ── Trip reminder cron ────────────────────────────────────────────────────────
  // Runs every hour — finds trips starting in the next 24–25h, sends one reminder

  @Cron(CronExpression.EVERY_HOUR)
  async checkTripReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingTrips = await this.prisma.itinerary.findMany({
      where: {
        deletedAt: null,
        startDate: { gte: in24h, lt: in25h },
      },
      select: { id: true, userId: true, destination: true, startDate: true },
    });

    for (const trip of upcomingTrips) {
      try {
        await this.createNotification(
          trip.userId,
          NotificationType.TRIP_REMINDER,
          `Your trip to ${trip.destination} starts tomorrow!`,
          `Don't forget to check your itinerary.`,
          { itineraryId: trip.id },
        );
      } catch (err) {
        this.logger.warn(`Failed to send trip reminder for ${trip.id}: ${err}`);
      }
    }

    if (upcomingTrips.length > 0) {
      this.logger.log(`Sent ${upcomingTrips.length} trip reminder notifications`);
    }
  }
}
