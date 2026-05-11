import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import {
  GeminiService,
  GeneratedItineraryResponse,
} from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ItineraryGenerationService } from './itinerary-generation.service';
import { GeneratedItinerary } from './types';

import { FormattedPlace } from '../attractions/types';

type ItineraryGenerateStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'attractions'; data: FormattedPlace[] }
  | { type: 'chunk'; content: string; message: string }
  | { type: 'complete'; itineraryId: string }
  | { type: 'error'; error: string };

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly itineraryGenerationService: ItineraryGenerationService,
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
        generated: this.mapToGeneratedItinerary(generated),
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

  /**
   * Generates an itinerary and streams progress/result via SSE.
   * This keeps the controller "routing only" by returning an Observable.
   */
  generateStream(
    userId: string,
    createItineraryDto: CreateItineraryDto,
  ): Observable<ItineraryGenerateStreamEvent> {
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

          const chunks: string[] = [];

          this.geminiService
            .streamGenerateObservable(prepared.prompt)
            .subscribe({
              next: (event) => {
                if (event.type === 'chunk') {
                  chunks.push(event.content);
                  subscriber.next({
                    type: 'chunk',
                    content: event.content,
                    message: 'Receiving itinerary details...',
                  });
                  return;
                }

                // When Gemini finishes, we have the full data
                const generated = this.parseGeneratedItinerary(
                  event.data,
                  chunks.join(''),
                );

                subscriber.next({
                  type: 'status',
                  message: 'Finalizing and saving your adventure...',
                });

                from(
                  this.itineraryGenerationService.persistGeneratedItinerary({
                    userId,
                    createItineraryDto,
                    generated,
                    generationStart: prepared.generationStart,
                    weatherData: prepared.weatherData,
                    attractions: prepared.attractions,
                    prompt: prepared.prompt,
                    promptHash: this.hashString(prepared.prompt),
                  }),
                ).subscribe({
                  next: (saved) => {
                    subscriber.next({
                      type: 'complete',
                      itineraryId: saved.id,
                    });
                    subscriber.complete();
                  },
                  error: (error: unknown) => {
                    subscriber.next({
                      type: 'error',
                      error: this.toUserFriendlyError(error),
                    });
                    subscriber.complete();
                  },
                });
              },
              error: (error: unknown) => {
                subscriber.next({
                  type: 'error',
                  error: this.toUserFriendlyError(error),
                });
                subscriber.complete();
              },
            });
        } catch (error) {
          subscriber.next({
            type: 'error',
            error: this.toUserFriendlyError(error),
          });
          subscriber.complete();
        }
      })();
    });
  }

  private toUserFriendlyError(error: unknown): string {
    if (error instanceof ServiceUnavailableException) {
      return error.message;
    }
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('timeout')) {
        return 'Generation timed out. Please try again.';
      }
      if (error.message.toLowerCase().includes('parse')) {
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
        days: data,
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
      summary: response.summary || {},
      days: response.days || [],
      generalTips: response.generalTips || [],
    };
  }
}
