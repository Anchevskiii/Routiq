import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as ics from 'ics';
import { PrismaService } from '../prisma/prisma.service';

interface ItineraryModel {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelType: string;
  weatherData?: Record<string, unknown>;
  days: unknown;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DayEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface Activity {
  title?: string;
  description?: string;
  location?: string;
  time?: string;
  duration?: number;
}

interface ItineraryDay {
  activities?: Activity[];
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
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    try {
      const events = this.parseItineraryToEvents(itinerary);
      const icsData = await this.createIcsCalendar(events, itinerary);

      return Buffer.from(icsData);
    } catch {
      throw new BadRequestException('Failed to generate ICS file');
    }
  }

  private parseItineraryToEvents(
    itinerary: ItineraryModel & { days?: ItineraryDay[] },
  ): DayEvent[] {
    const events: DayEvent[] = [];

    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      return events;
    }

    itinerary.days.forEach((day: ItineraryDay, dayIndex: number) => {
      const dayDate = new Date(itinerary.startDate);
      dayDate.setDate(dayDate.getDate() + dayIndex);

      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((activity: Activity) => {
          const event: DayEvent = {
            title: activity.title || 'Activity',
            description: activity.description || '',
            location: activity.location || itinerary.destination,
            startTime: this.combineDateTime(dayDate, activity.time || '09:00'),
            endTime: this.calculateEndTime(
              dayDate,
              activity.time || '09:00',
              activity.duration || 2,
            ),
          };

          events.push(event);
        });
      }
    });

    return events;
  }

  private combineDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    return eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private calculateEndTime(
    date: Date,
    startTime: string,
    durationHours: number,
  ): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours + durationHours, minutes, 0, 0);

    return eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private async createIcsCalendar(
    events: DayEvent[],
    itinerary: ItineraryModel,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const icsEvents = events.map((event) => ({
        start: this.formatDateForIcs(event.startTime),
        end: this.formatDateForIcs(event.endTime),
        title: event.title,
        description: event.description,
        location: event.location,
        calName: `${itinerary.destination} - Itinerary`,
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
    // In a real implementation, you might generate a temporary signed URL
    // For now, we'll return the direct endpoint URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/api/export/${itineraryId}/ics`;
  }
}
