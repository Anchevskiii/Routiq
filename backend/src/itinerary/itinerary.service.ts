import { Injectable, NotFoundException } from '@nestjs/common';
import { AttractionsService } from '../attractions/attractions.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { buildItineraryPrompt } from './prompts/generate-itinerary.prompt';

@Injectable()
export class ItineraryService {
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
    const generatedItinerary = await this.geminiService.streamGenerate(prompt);

    // Save the generated itinerary
    const itinerary = await this.prisma.itinerary.create({
      data: {
        userId,
        destination,
        startDate: startDate,
        endDate: endDate,
        travelType,
        weatherData,
        days: generatedItinerary,
      },
    });

    return itinerary;
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
          createdAt: true,
          updatedAt: true,
          shareToken: true,
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
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    return itinerary;
  }

  async getItineraryByShareToken(shareToken: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { shareToken },
      select: {
        id: true,
        destination: true,
        startDate: true,
        endDate: true,
        travelType: true,
        weatherData: true,
        days: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
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
      data: updateItineraryDto,
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
}
