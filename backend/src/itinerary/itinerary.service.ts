import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import {
  GeminiService,
  GeminiStreamEvent,
  GeneratedItineraryResponse,
} from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ReorderDaysDto } from './dto/reorder-days.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ItineraryGenerationService } from './itinerary-generation.service';
import { InvitationStatus } from '@prisma/client';
import { WeatherService } from '../weather/weather.service';
import { GeneratedDay, GeneratedItinerary } from './types';

import { Prisma } from '@prisma/client';
import { FormattedPlace } from '../attractions/types';
import { randomBytes, createHash } from 'crypto';

export type ItineraryGenerateStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'attractions'; data: FormattedPlace[] }
  | { type: 'day'; data: Prisma.ItineraryDayCreateWithoutItineraryInput }
  | { type: 'complete'; itineraryId: string }
  | { type: 'error'; error: string };

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly itineraryGenerationService: ItineraryGenerationService,
    private readonly weatherService: WeatherService,
  ) {}

  async generateItinerary(
    userId: string,
    createItineraryDto: CreateItineraryDto,
  ) {
    const prepared =
      await this.itineraryGenerationService.prepareGenerationData(
        createItineraryDto,
      );
    const generated = await this.geminiService.streamGenerate(prepared.prompt);
    const itinerary =
      await this.itineraryGenerationService.persistGeneratedItinerary({
        userId,
        createItineraryDto,
        generated: this.parseGeneratedItinerary(generated, ''),
        generationStart: prepared.generationStart,
        weatherData: prepared.weatherData,
        attractions: prepared.attractions,
        prompt: prepared.prompt,
        promptHash: this.hashString(prepared.prompt),
      });

    return this.getItineraryById(itinerary.id, userId);
  }

  async getUserItineraries(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const baseWhere = { userId, deletedAt: null };

    const [itineraries, total, sharedCount] = await Promise.all([
      this.prisma.itinerary.findMany({
        where: baseWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          destination: true,
          startDate: true,
          endDate: true,
          travelType: true,
          totalDays: true,
          isPublic: true,
          shareToken: true,
          bestSeason: true,
          estimatedBudget: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              days: true,
            },
          },
          groupItineraries: {
            select: {
              groupId: true,
              group: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: baseWhere }),
      this.prisma.itinerary.count({
        where: {
          ...baseWhere,
          groupItineraries: { some: { deletedAt: null } },
        },
      }),
    ]);

    return {
      itineraries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sharedCount,
      },
    };
  }

  async getItineraryById(id: string, userId?: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(userId && {
          OR: [
            { userId },
            {
              groupItineraries: {
                some: {
                  deletedAt: null,
                  group: {
                    members: {
                      some: {
                        userId,
                        status: InvitationStatus.ACCEPTED,
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
            },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        days: {
          where: { deletedAt: null },
          orderBy: { dayNumber: 'asc' },
          include: {
            activities: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            weather: true,
          },
        },
        generalTips: {
          orderBy: { sortOrder: 'asc' },
        },
        groupItineraries: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    return itinerary;
  }

  async getItineraryByShareToken(shareToken: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { shareToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            activities: {
              orderBy: { sortOrder: 'asc' },
            },
            weather: true,
          },
        },
        generalTips: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    return itinerary;
  }

  async updateItinerary(
    id: string,
    userId: string,
    updateItineraryDto: UpdateItineraryDto,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, userId },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const updatedItinerary = await this.prisma.itinerary.update({
      where: { id },
      data: {
        destination: updateItineraryDto.destination,
        name: updateItineraryDto.name,
        startDate: updateItineraryDto.startDate,
        endDate: updateItineraryDto.endDate,
      },
    });

    return updatedItinerary;
  }

  async deleteItinerary(id: string, userId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, userId },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.itinerary.update({
        where: { id },
        data: { deletedAt: now },
      }),
      this.prisma.groupItinerary.updateMany({
        where: { itineraryId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
    ]);

    return { message: 'Itinerary deleted successfully' };
  }

  async generateShareToken(id: string, userId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, userId },
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    if (itinerary.shareToken) {
      return { shareToken: itinerary.shareToken };
    }

    const shareToken = this.generateRandomToken();

    const updatedItinerary = await this.prisma.itinerary.update({
      where: { id },
      data: { shareToken },
    });

    return { shareToken: updatedItinerary.shareToken };
  }

  async reorderDays(itineraryId: string, userId: string, dto: ReorderDaysDto) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
    });
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const startDate = new Date(itinerary.startDate);
    const count = dto.dayIds.length;

    // Two-phase update to avoid @@unique([itineraryId, dayNumber]) conflicts:
    // Phase 1: move all dayNumbers to a safe temporary range (count + index)
    // Phase 2: set final dayNumbers (1-based)
    const phase1 = dto.dayIds.map((dayId, index) =>
      this.prisma.itineraryDay.update({
        where: { id: dayId },
        data: { dayNumber: count + index + 1 },
      }),
    );

    const phase2 = dto.dayIds.map((dayId, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return this.prisma.itineraryDay.update({
        where: { id: dayId },
        data: { dayNumber: index + 1, date },
      });
    });

    await this.prisma.$transaction(phase1);
    const result = await this.prisma.$transaction(phase2);

    // Background: refresh weather snapshots for the newly assigned dates
    this.refreshWeatherForReorderedDays(
      itinerary.destination,
      dto.dayIds,
      startDate,
    ).catch((err: unknown) =>
      this.logger.warn(
        `Weather refresh after reorder failed: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );

    return result;
  }

  async reorderActivities(
    itineraryId: string,
    dayId: string,
    userId: string,
    dto: ReorderActivitiesDto,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
    });
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const updates = dto.activityIds.map((activityId, index) =>
      this.prisma.itineraryActivity.update({
        where: { id: activityId },
        data: { sortOrder: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);
    await this.cascadeActivityTimes(dayId);

    return this.prisma.itineraryActivity.findMany({
      where: { dayId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateActivity(
    itineraryId: string,
    activityId: string,
    userId: string,
    dto: UpdateActivityDto,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
    });
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const activity = await this.prisma.itineraryActivity.findFirst({
      where: { id: activityId, deletedAt: null },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const updated = await this.prisma.itineraryActivity.update({
      where: { id: activityId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.durationMinutes !== undefined && {
          durationMinutes: dto.durationMinutes,
        }),
      },
    });

    if (dto.startTime !== undefined || dto.durationMinutes !== undefined) {
      await this.cascadeActivityTimes(activity.dayId);
    }

    return updated;
  }

  async addActivity(
    itineraryId: string,
    dayId: string,
    userId: string,
    dto: CreateActivityDto,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
    });
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const existing = await this.prisma.itineraryActivity.findMany({
      where: { dayId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    let insertAt = existing.length; // 0-based index to insert at (append)

    if (dto.startTime) {
      const newTime = this.parseTime(dto.startTime);
      insertAt = existing.findIndex(
        (a) =>
          a.startTime !== null &&
          a.startTime !== undefined &&
          this.parseTime(a.startTime) > newTime,
      );
      if (insertAt === -1) insertAt = existing.length;
    }

    // Shift sortOrders for activities after insert position
    if (insertAt < existing.length) {
      await this.prisma.$transaction(
        existing.slice(insertAt).map((a) =>
          this.prisma.itineraryActivity.update({
            where: { id: a.id },
            data: { sortOrder: a.sortOrder + 1 },
          }),
        ),
      );
    }

    const created = await this.prisma.itineraryActivity.create({
      data: {
        dayId,
        title: dto.title,
        location: dto.location,
        address: dto.address,
        placeId: dto.placeId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        startTime: dto.startTime,
        sortOrder: insertAt + 1,
      },
    });

    await this.cascadeActivityTimes(dayId);
    return created;
  }

  async deleteActivity(
    itineraryId: string,
    activityId: string,
    userId: string,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, userId },
    });
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    const activity = await this.prisma.itineraryActivity.findFirst({
      where: { id: activityId, deletedAt: null },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    await this.prisma.itineraryActivity.update({
      where: { id: activityId },
      data: { deletedAt: new Date() },
    });

    // Renumber remaining sortOrders to be contiguous
    const remaining = await this.prisma.itineraryActivity.findMany({
      where: { dayId: activity.dayId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    await this.prisma.$transaction(
      remaining.map((a, index) =>
        this.prisma.itineraryActivity.update({
          where: { id: a.id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    return { message: 'Activity deleted successfully' };
  }

  private async refreshWeatherForReorderedDays(
    destination: string,
    dayIds: string[],
    startDate: Date,
  ): Promise<void> {
    const forecast = await this.weatherService.getForecast(
      destination,
      startDate.toISOString().split('T')[0],
      dayIds.length,
    );
    await Promise.all(
      dayIds.map((dayId, index) => {
        const forecastDay = forecast.forecast[index];
        if (!forecastDay) return Promise.resolve();
        return this.prisma.itineraryWeatherSnapshot.upsert({
          where: { dayId },
          update: {
            condition: forecastDay.condition,
            tempMin: forecastDay.temperature.min,
            tempMax: forecastDay.temperature.max,
            humidity: forecastDay.humidity,
            windSpeed: forecastDay.windSpeed,
            precipitation: forecastDay.precipitation,
            fetchedAt: new Date(),
          },
          create: {
            dayId,
            condition: forecastDay.condition,
            tempMin: forecastDay.temperature.min,
            tempMax: forecastDay.temperature.max,
            humidity: forecastDay.humidity,
            windSpeed: forecastDay.windSpeed,
            precipitation: forecastDay.precipitation,
          },
        });
      }),
    );
  }

  private async cascadeActivityTimes(dayId: string): Promise<void> {
    const activities = await this.prisma.itineraryActivity.findMany({
      where: { dayId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    const updates: { id: string; startTime: string }[] = [];
    let prevStartTime: string | null = null;
    let prevDuration: number | null = null;

    for (const activity of activities) {
      if (prevStartTime !== null && prevDuration !== null) {
        const prevEndMinutes = this.parseTime(prevStartTime) + prevDuration;
        const currentMinutes =
          activity.startTime !== null && activity.startTime !== undefined
            ? this.parseTime(activity.startTime)
            : null;

        if (currentMinutes !== null && currentMinutes < prevEndMinutes) {
          const newStartTime = this.formatTime(prevEndMinutes);
          updates.push({ id: activity.id, startTime: newStartTime });
          prevStartTime = newStartTime;
        } else {
          prevStartTime = activity.startTime ?? null;
        }
      } else {
        prevStartTime = activity.startTime ?? null;
      }
      prevDuration = activity.durationMinutes ?? null;
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(
        updates.map((u) =>
          this.prisma.itineraryActivity.update({
            where: { id: u.id },
            data: { startTime: u.startTime },
          }),
        ),
      );
    }
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

  private hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

  /**
   * Generates an itinerary and streams progress/result via SSE.
   * This keeps the controller "routing only" by returning an Observable.
   */
  generateStream(
    userId: string,
    createItineraryDto: CreateItineraryDto,
  ): Observable<ItineraryGenerateStreamEvent> {
    const requestStart = Date.now();
    this.logger.log(
      `[PERF] generateStream request received at ${new Date(requestStart).toISOString()}`,
    );

    return new Observable<ItineraryGenerateStreamEvent>((subscriber) => {
      void (async () => {
        try {
          subscriber.next({
            type: 'status',
            message: 'Discovering the best spots for you...',
          });

          const prepared =
            await this.itineraryGenerationService.prepareGenerationData(
              createItineraryDto,
            );

          // Send attractions early so frontend can show them
          subscriber.next({
            type: 'attractions',
            data: prepared.attractions,
          });

          subscriber.next({
            type: 'status',
            message: 'Our AI is now crafting your perfect route...',
          });

          const fullDays: GeneratedDay[] = [];
          let currentBuffer = '';
          let lastEmittedDay = 0;

          this.geminiService
            .streamGenerateObservable(prepared.prompt)
            .subscribe({
              next: (event: GeminiStreamEvent) => {
                if (event.type === 'chunk') {
                  currentBuffer += event.content;
                  const parsedDays = this.extractDaysFromBuffer(currentBuffer);

                  for (const dayJson of parsedDays) {
                    if (dayJson.day > lastEmittedDay) {
                      const dayStart = Date.now();
                      const enrichedDay =
                        this.itineraryGenerationService.mapSingleDay(
                          dayJson,
                          createItineraryDto.startDate,
                          prepared.weatherData,
                          prepared.attractions,
                        );

                      this.logger.log(
                        `[PERF] Day ${dayJson.day} processed and emitted after ${Date.now() - requestStart}ms (enrichment took ${Date.now() - dayStart}ms)`,
                      );

                      subscriber.next({
                        type: 'day',
                        data: enrichedDay,
                      });

                      fullDays.push(dayJson);
                      lastEmittedDay = dayJson.day;
                    }
                  }
                  return;
                }

                if (event.type === 'complete') {
                  // Final save
                  subscriber.next({
                    type: 'status',
                    message: 'Finalizing and saving your adventure...',
                  });

                  // Use the complete parsed data from GeminiService, fallback to incremental buffer if needed
                  const finalGenerated = this.parseGeneratedItinerary(
                    event.data,
                    currentBuffer,
                  );

                  const persistStart = Date.now();
                  from(
                    this.itineraryGenerationService.persistGeneratedItinerary({
                      userId,
                      createItineraryDto,
                      generated: finalGenerated,
                      generationStart: prepared.generationStart,
                      weatherData: prepared.weatherData,
                      attractions: prepared.attractions,
                      prompt: prepared.prompt,
                      promptHash: this.hashString(prepared.prompt),
                    }),
                  ).subscribe({
                    next: (saved) => {
                      this.logger.log(
                        `[PERF] Itinerary persisted in ${Date.now() - persistStart}ms. Total generation time: ${Date.now() - requestStart}ms`,
                      );
                      subscriber.next({
                        type: 'complete',
                        itineraryId: saved.id,
                      });
                      subscriber.complete();
                    },
                    error: (error: Error) => {
                      subscriber.next({
                        type: 'error',
                        error: this.toUserFriendlyError(error),
                      });
                      subscriber.complete();
                    },
                  });
                }
              },
              error: (error: Error) => {
                subscriber.next({
                  type: 'error',
                  error: this.toUserFriendlyError(error),
                });
                subscriber.complete();
              },
            });
        } catch (error: unknown) {
          subscriber.next({
            type: 'error',
            error: this.toUserFriendlyError(error),
          });
          subscriber.complete();
        }
      })();
    });
  }

  /**
   * Extracts complete JSON objects (days) from a streaming buffer using brace counting.
   */
  private extractDaysFromBuffer(buffer: string): GeneratedDay[] {
    const days: GeneratedDay[] = [];
    let currentBuffer = buffer;
    let startIndex = currentBuffer.indexOf('{');

    while (startIndex !== -1) {
      let braceCount = 0;
      let endIndex = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = startIndex; i < currentBuffer.length; i++) {
        const char = currentBuffer[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;

          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex !== -1) {
        const potentialJson = currentBuffer.slice(startIndex, endIndex + 1);
        try {
          const dayJson = JSON.parse(potentialJson) as GeneratedDay;
          if (dayJson && typeof dayJson.day === 'number') {
            days.push(dayJson);
          }
        } catch {
          // Not a complete day object yet or invalid JSON
        }
        currentBuffer = currentBuffer.slice(endIndex + 1);
        startIndex = currentBuffer.indexOf('{');
      } else {
        break;
      }
    }
    return days;
  }

  private toUserFriendlyError(error: unknown): string {
    if (error instanceof ServiceUnavailableException) {
      return error.message;
    }
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('timeout')) {
        return 'Generation timed out. Please try again.';
      }
      if (msg.includes('parse') || msg.includes('json')) {
        return 'AI response format was invalid. Please retry generation.';
      }
      return error.message;
    }
    return 'Failed to generate itinerary. Please try again.';
  }

  private parseGeneratedItinerary(
    parsedData: unknown,
    rawJsonFallback: string,
  ): GeneratedItinerary {
    const data =
      parsedData || (rawJsonFallback ? JSON.parse(rawJsonFallback) : null);

    if (!data) {
      throw new ServiceUnavailableException('AI response was empty');
    }

    // If data is an array (our new minimalist schema), wrap it in a GeneratedItinerary object
    if (Array.isArray(data)) {
      return {
        days: data as GeneratedDay[],
        summary: {},
        generalTips: [],
      };
    }

    if (
      typeof data === 'object' &&
      Array.isArray((data as { days?: unknown }).days)
    ) {
      return this.mapToGeneratedItinerary(data as GeneratedItineraryResponse);
    }

    throw new ServiceUnavailableException(
      'AI response format was invalid. Please retry generation.',
    );
  }

  private mapToGeneratedItinerary(
    response: GeneratedItineraryResponse,
  ): GeneratedItinerary {
    return {
      summary: response?.summary || {},
      days: response?.days || [],
      generalTips: response?.generalTips || [],
    };
  }
}
