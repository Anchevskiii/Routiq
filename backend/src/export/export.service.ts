import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as ics from 'ics';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface IcsEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToIcs(itineraryId: string, userId?: string): Promise<Buffer> {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        ...(userId && { userId }),
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            activities: {
              where: {
                activityType: {
                  in: [ActivityType.ATTRACTION, ActivityType.MEAL],
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    // Track export
    if (userId) {
      await this.prisma.calendarExport.create({
        data: {
          userId,
          itineraryId,
          format: 'ICS',
        },
      });
    }

    try {
      const events = this.buildEventsFromDays(itinerary);
      const icsData = await this.createIcsCalendar(
        events,
        itinerary.destination,
      );

      return Buffer.from(icsData);
    } catch {
      throw new BadRequestException('Failed to generate ICS file');
    }
  }

  private buildEventsFromDays(itinerary: {
    destination: string;
    days: Array<{
      date: Date;
      activities: Array<{
        title: string;
        description: string | null;
        location: string | null;
        startTime: string | null;
        durationMinutes: number | null;
        activityType: ActivityType;
      }>;
    }>;
  }): IcsEvent[] {
    const events: IcsEvent[] = [];

    for (const day of itinerary.days) {
      for (const activity of day.activities) {
        const startTime = activity.startTime ?? '09:00';
        const durationHours = (activity.durationMinutes ?? 120) / 60;

        events.push({
          title: activity.title,
          description: activity.description ?? '',
          location: activity.location ?? itinerary.destination,
          startTime: this.combineDateTime(day.date, startTime),
          endTime: this.calculateEndTime(day.date, startTime, durationHours),
        });
      }
    }

    return events;
  }

  private combineDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours || 9, minutes || 0, 0, 0);

    return eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private calculateEndTime(
    date: Date,
    startTime: string,
    durationHours: number,
  ): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours((hours || 9) + durationHours, minutes || 0, 0, 0);

    return eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private async createIcsCalendar(
    events: IcsEvent[],
    destination: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const icsEvents = events.map((event) => ({
        start: this.formatDateForIcs(event.startTime),
        end: this.formatDateForIcs(event.endTime),
        title: event.title,
        description: event.description,
        location: event.location,
        calName: `${destination} - Routiq Itinerary`,
      }));

      ics.createEvents(icsEvents, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }

  private formatDateForIcs(
    dateString: string,
  ): [number, number, number, number, number] {
    const date = new Date(dateString);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ];
  }

  async getExportUrl(itineraryId: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/api/export/${itineraryId}/ics`;
  }
}
