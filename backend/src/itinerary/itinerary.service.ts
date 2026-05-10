import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { Observable, from, map, switchMap, catchError, of } from 'rxjs';
import { AttractionsService } from '../attractions/attractions.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService, TransactionClient } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { buildItineraryPrompt } from './prompts/generate-itinerary.prompt';
import { GeneratedDay, GeneratedItinerary } from './types';

type ItineraryGenerateStreamEvent =
  | { type: 'complete'; itineraryId: string }
  | { type: 'progress'; message: string }
  | { type: 'error'; error: string };

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly attractionsService: AttractionsService,
    private readonly weatherService: WeatherService,
  ) {}

  async generateItinerary(
    userId: string,
    createItineraryDto: CreateItineraryDto,
  ) {
    const { destination, startDate, endDate, days, travelType } =
      createItineraryDto;

    const generationStart = Date.now();

    // Get weather forecast
    const weatherData = await this.weatherService.getForecast(
      destination,
      startDate.toISOString().split('T')[0],
      days,
    );

    // Get attractions for the destination
    const attractions = await this.attractionsService.getAttractions(
      destination,
      travelType,
    );

    // Build the prompt for AI
    const prompt = buildItineraryPrompt({
      destination,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
      travelType,
      weatherData,
      attractions,
    });

    // Generate itinerary using AI
    const generated = (await this.geminiService.streamGenerate(
      prompt,
    )) as GeneratedItinerary;

    const generationTimeMs = Date.now() - generationStart;

    // Save the generated itinerary in a transaction (normalized)
    const itinerary = await this.prisma.$transaction(async (tx) => {
      // 1. Create itinerary master record
      const itineraryRecord = await tx.itinerary.create({
        data: {
          userId,
          destination,
          startDate,
          endDate,
          travelType,
          totalDays: days,
          aiModel: 'gemini-2.0-flash-exp',
          aiPromptHash: this.hashString(prompt),
          generatedAt: new Date(),
          generationTimeMs,
          bestSeason: generated.summary?.bestSeason ?? null,
          estimatedBudget: generated.summary?.estimatedBudget ?? null,
        },
      });

      // 2. Create days with activities and weather snapshots
      if (generated.days && Array.isArray(generated.days)) {
        for (const day of generated.days) {
          await this.createDayWithActivities(
            tx,
            itineraryRecord.id,
            day,
            startDate,
            weatherData,
          );
        }
      }

      // 3. Create general tips
      if (generated.generalTips && Array.isArray(generated.generalTips)) {
        for (let i = 0; i < generated.generalTips.length; i++) {
          await tx.itineraryTip.create({
            data: {
              itineraryId: itineraryRecord.id,
              sortOrder: i,
              content: generated.generalTips[i],
            },
          });
        }
      }

      return itineraryRecord;
    });

    // Return the full itinerary with all relations
    return this.getItineraryById(itinerary.id, userId);
  }

  private async createDayWithActivities(
    tx: TransactionClient,
    itineraryId: string,
    day: GeneratedDay,
    tripStartDate: Date,
    weatherData: {
      forecast: Array<{
        date: string;
        temperature: { min: number; max: number };
        condition: string;
        humidity: number;
        windSpeed: number;
        precipitation: number;
      }>;
    },
  ) {
    const dayDate = new Date(tripStartDate);
    dayDate.setDate(dayDate.getDate() + (day.day - 1));

    const dayRecord = await tx.itineraryDay.create({
      data: {
        itineraryId,
        dayNumber: day.day,
        date: dayDate,
        theme: day.theme ?? null,
      },
    });

    // Create activities
    let sortOrder = 0;

    if (day.activities && Array.isArray(day.activities)) {
      for (const activity of day.activities) {
        await tx.itineraryActivity.create({
          data: {
            dayId: dayRecord.id,
            activityType: ActivityType.ATTRACTION,
            sortOrder: sortOrder++,
            title: activity.title,
            description: activity.description ?? null,
            location: activity.location ?? null,
            startTime: activity.time ?? null,
            durationMinutes: this.parseDuration(activity.duration),
            cost: activity.cost ?? null,
            tips: activity.tips ?? null,
            latitude: activity.coordinates?.lat ?? null,
            longitude: activity.coordinates?.lng ?? null,
          },
        });
      }
    }

    // Create meal entries
    if (day.meals && Array.isArray(day.meals)) {
      for (const meal of day.meals) {
        await tx.itineraryActivity.create({
          data: {
            dayId: dayRecord.id,
            activityType: ActivityType.MEAL,
            sortOrder: sortOrder++,
            title: meal.recommendation || `${meal.type} recommendation`,
            description: null,
            location: meal.location ?? null,
            mealType: meal.type ?? null,
            priceRange: meal.priceRange ?? null,
          },
        });
      }
    }

    // Create transport entry
    if (day.transportation) {
      await tx.itineraryActivity.create({
        data: {
          dayId: dayRecord.id,
          activityType: ActivityType.TRANSPORT,
          sortOrder: sortOrder++,
          title: `Daily transport: ${day.transportation.method ?? 'various'}`,
          transportMethod: day.transportation.method ?? null,
          transportCost: day.transportation.estimatedCost ?? null,
          transportNotes: day.transportation.notes ?? null,
        },
      });
    }

    // Create weather snapshot
    const dayDateStr = dayDate.toISOString().split('T')[0];
    const forecastDay = weatherData.forecast.find((f) => f.date === dayDateStr);

    if (forecastDay) {
      await tx.itineraryWeatherSnapshot.create({
        data: {
          dayId: dayRecord.id,
          condition: forecastDay.condition,
          tempMin: forecastDay.temperature.min,
          tempMax: forecastDay.temperature.max,
          humidity: forecastDay.humidity,
          windSpeed: forecastDay.windSpeed,
          precipitation: forecastDay.precipitation,
          recommendation: day.weather?.recommendations ?? null,
        },
      });
    } else if (day.weather) {
      await tx.itineraryWeatherSnapshot.create({
        data: {
          dayId: dayRecord.id,
          condition: day.weather.condition,
          recommendation: day.weather.recommendations ?? null,
        },
      });
    }
  }

  async getUserItineraries(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      this.prisma.itinerary.findMany({
        where: { userId },
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
        },
      }),
      this.prisma.itinerary.count({
        where: { userId },
      }),
    ]);

    return {
      itineraries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getItineraryById(id: string, userId?: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: {
        id,
        ...(userId && { userId }),
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

    await this.prisma.itinerary.delete({
      where: { id },
    });

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

  private generateRandomToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private parseDuration(duration: unknown): number | null {
    if (typeof duration === 'number') {
      return Math.round(duration * 60);
    }
    if (typeof duration === 'string') {
      const parsed = parseFloat(duration);
      if (!isNaN(parsed)) {
        return Math.round(parsed * 60);
      }
    }
    return null;
  }

  /**
   * Generates an itinerary and streams progress/result via SSE.
   * This keeps the controller "routing only" by returning an Observable.
   */
  generateStream(
    userId: string,
    createItineraryDto: CreateItineraryDto,
  ): Observable<ItineraryGenerateStreamEvent> {
    const { destination, startDate, days, travelType } = createItineraryDto;

    return from(
      this.weatherService.getForecast(
        destination,
        startDate.toISOString().split('T')[0],
        days,
      ),
    ).pipe(
      switchMap((weatherData) =>
        from(
          this.attractionsService.getAttractions(destination, travelType),
        ).pipe(map((attractions) => ({ weatherData, attractions }))),
      ),
      switchMap(({ weatherData, attractions }) => {
        const prompt = buildItineraryPrompt({
          destination,
          startDate: startDate.toISOString(),
          endDate: createItineraryDto.endDate.toISOString(),
          days,
          travelType,
          weatherData,
          attractions,
        });

        const generationStart = Date.now();

        return this.geminiService.streamGenerateObservable(prompt).pipe(
          switchMap(async (event) => {
            if (event.type === 'complete') {
              const generated = event.data as GeneratedItinerary;
              const generationTimeMs = Date.now() - generationStart;

              const itinerary = await this.prisma.$transaction(async (tx) => {
                const itineraryRecord = await tx.itinerary.create({
                  data: {
                    userId,
                    destination,
                    startDate,
                    endDate: createItineraryDto.endDate,
                    travelType,
                    totalDays: days,
                    aiModel: 'gemini-2.0-flash-exp',
                    aiPromptHash: this.hashString(prompt),
                    generatedAt: new Date(),
                    generationTimeMs,
                    bestSeason: generated.summary?.bestSeason ?? null,
                    estimatedBudget: generated.summary?.estimatedBudget ?? null,
                  },
                });

                if (generated.days && Array.isArray(generated.days)) {
                  for (const day of generated.days) {
                    await this.createDayWithActivities(
                      tx,
                      itineraryRecord.id,
                      day,
                      startDate,
                      weatherData,
                    );
                  }
                }

                if (
                  generated.generalTips &&
                  Array.isArray(generated.generalTips)
                ) {
                  for (let i = 0; i < generated.generalTips.length; i++) {
                    await tx.itineraryTip.create({
                      data: {
                        itineraryId: itineraryRecord.id,
                        sortOrder: i,
                        content: generated.generalTips[i],
                      },
                    });
                  }
                }

                return itineraryRecord;
              });

              return {
                type: 'complete' as const,
                itineraryId: itinerary.id,
              };
            }
            return {
              type: 'progress' as const,
              message: event.content || 'Generating...',
            };
          }),
        );
      }),
      catchError((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Generation failed.';
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(`Generation failed: ${message}`, stack);
        return of({ type: 'error' as const, error: message });
      }),
    );
  }
}
