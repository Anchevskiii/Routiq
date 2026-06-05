import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { AttractionsService } from '../attractions/attractions.service';
import { FormattedPlace } from '../attractions/types';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherData } from '../weather/types';
import { WeatherService } from '../weather/weather.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { buildItineraryPrompt } from './prompts/generate-itinerary.prompt';
import { GeneratedActivity, GeneratedDay, GeneratedItinerary } from './types';

export interface PreparedGenerationData {
  generationStart: number;
  weatherData: WeatherData;
  attractions: FormattedPlace[];
  prompt: string;
}

@Injectable()
export class ItineraryGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attractionsService: AttractionsService,
    private readonly weatherService: WeatherService,
    private readonly configService: AppConfigService,
  ) {}

  async prepareGenerationData(
    createItineraryDto: CreateItineraryDto,
  ): Promise<PreparedGenerationData> {
    const { destination, startDate, endDate, days, travelType } =
      createItineraryDto;
    const generationStart = Date.now();
    console.log(
      `[PERF] prepareGenerationData started at ${new Date(generationStart).toISOString()}`,
    );

    const [weatherData, attractions] = await Promise.all([
      this.weatherService.getForecast(
        destination,
        startDate.toISOString(),
        days,
      ),
      this.attractionsService.getCuratedPlaces(destination, travelType, days),
    ]);
    console.log(
      `[PERF] Data fetching (parallel) took ${Date.now() - generationStart}ms`,
    );

    const prompt = buildItineraryPrompt({
      destination,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
      travelType,
      weatherData,
      attractions,
      travelTimeContext: '', // Not needed for minimalist prompt
    });

    console.log(
      `[PERF] prepareGenerationData total took ${Date.now() - generationStart}ms`,
    );

    return {
      generationStart,
      weatherData,
      attractions,
      prompt,
    };
  }

  async persistGeneratedItinerary(params: {
    userId: string;
    createItineraryDto: CreateItineraryDto;
    generated: GeneratedItinerary;
    generationStart: number;
    weatherData: WeatherData;
    attractions: FormattedPlace[];
    prompt: string;
    promptHash: string;
  }) {
    const {
      userId,
      createItineraryDto,
      generated,
      generationStart,
      weatherData,
      attractions,
      promptHash,
    } = params;
    const generationTimeMs = Date.now() - generationStart;

    // Handle minimalist Gemini response by defaulting summaries and tips
    const bestSeason = generated.summary?.bestSeason ?? 'Varies by region';
    const estimatedBudget =
      generated.summary?.estimatedBudget ?? 'Contact local guides for pricing';

    const geocodeStart = Date.now();

    // 1. Pre-map all days and pre-geocode all activities in parallel OUTSIDE the transaction
    const mappedDays = await Promise.all(
      (generated.days ?? []).map(async (day) => {
        const mappedDay = this.mapSingleDay(
          day,
          createItineraryDto.startDate,
          weatherData,
          attractions,
        );

        if (mappedDay.activities?.create) {
          const activitiesData = Array.isArray(mappedDay.activities.create)
            ? mappedDay.activities.create
            : [mappedDay.activities.create];

          if (activitiesData.length > 0) {
            const enrichedActivities = await Promise.all(
              activitiesData.map(async (act) => {
                if (act.latitude === null || act.longitude === null) {
                  const query = act.location || act.title;
                  if (query) {
                    const fullQuery = `${query}, ${createItineraryDto.destination}`;
                    const coords =
                      await this.attractionsService.geocodeAddress(fullQuery);
                    if (coords) {
                      return {
                        ...act,
                        latitude: coords.lat,
                        longitude: coords.lng,
                      };
                    }
                  }
                }
                return act;
              }),
            );
            mappedDay.activities.create = enrichedActivities;
          }
        }
        return mappedDay;
      }),
    );

    const geocodeTimeMs = Date.now() - geocodeStart;
    const txStart = Date.now();

    const itinerary = await this.prisma.$transaction(
      async (tx) => {
        // Create general tips array
        const generalTips = generated.generalTips ?? [
          'Check local transportation options before arrival.',
          'Keep digital copies of your travel documents.',
          'Respect local customs and traditions.',
        ];

        // 1. Create the parent Itinerary record with nested days, weather, activities, and tips
        const itineraryRecord = await tx.itinerary.create({
          data: {
            userId,
            destination: createItineraryDto.destination,
            startDate: createItineraryDto.startDate,
            endDate: createItineraryDto.endDate,
            travelType: createItineraryDto.travelType,
            totalDays: createItineraryDto.days,
            aiModel: 'gemini-2.5-flash',
            aiPromptHash: promptHash,
            generatedAt: new Date(),
            generationTimeMs,
            bestSeason,
            estimatedBudget,
            generalTips: {
              create: generalTips.map((tip, index) => ({
                sortOrder: index,
                content: tip,
              })),
            },
            days: {
              create: mappedDays.map((mappedDay) => {
                const weatherCreate = mappedDay.weather?.create;
                const activitiesCreate = mappedDay.activities?.create;

                return {
                  dayNumber: mappedDay.dayNumber,
                  date: mappedDay.date,
                  theme: mappedDay.theme,
                  weather: weatherCreate ? {
                    create: {
                      condition: weatherCreate.condition,
                      tempMin: weatherCreate.tempMin,
                      tempMax: weatherCreate.tempMax,
                      humidity: weatherCreate.humidity,
                      windSpeed: weatherCreate.windSpeed,
                      precipitation: weatherCreate.precipitation,
                      recommendation: weatherCreate.recommendation,
                    },
                  } : undefined,
                  activities: activitiesCreate ? {
                    create: (Array.isArray(activitiesCreate)
                      ? activitiesCreate
                      : [activitiesCreate]
                    ).map((act) => ({
                      activityType: act.activityType,
                      sortOrder: act.sortOrder,
                      title: act.title,
                      description: act.description,
                      location: act.location,
                      address: act.address,
                      startTime: act.startTime,
                      durationMinutes: act.durationMinutes,
                      cost: act.cost,
                      tips: act.tips,
                      latitude: act.latitude,
                      longitude: act.longitude,
                      placeId: act.placeId,
                      mealType: act.mealType,
                    })),
                  } : undefined,
                };
              }),
            },
          },
        });

        // 4. If groupId is provided, automatically link the itinerary to the group
        if (createItineraryDto.groupId) {
          await tx.groupItinerary.create({
            data: {
              groupId: createItineraryDto.groupId,
              itineraryId: itineraryRecord.id,
              addedById: userId,
            },
          });
        }

        return itineraryRecord;
      },
      {
        timeout: 5000, // Reverted to 5 seconds now that slow geocoding API calls are moved out
      },
    );

    const txTimeMs = Date.now() - txStart;

    return {
      itinerary,
      geocodeTimeMs,
      txTimeMs,
    };
  }

  mapDaysForNestedWrite(
    days: GeneratedDay[],
    tripStartDate: Date,
    weatherData: WeatherData,
    attractions: FormattedPlace[],
  ): Prisma.ItineraryDayCreateWithoutItineraryInput[] {
    return days.map((day) =>
      this.mapSingleDay(day, tripStartDate, weatherData, attractions),
    );
  }

  mapSingleDay(
    day: GeneratedDay,
    tripStartDate: Date,
    weatherData: WeatherData,
    attractions: FormattedPlace[],
  ): Prisma.ItineraryDayCreateWithoutItineraryInput {
    const dayDate = new Date(tripStartDate);
    dayDate.setUTCDate(dayDate.getUTCDate() + (day.day - 1));
    const dayDateStr = dayDate.toISOString().split('T')[0];
    const forecastDay = weatherData.forecast.find((f) => f.date === dayDateStr);

    // AI might return activities in a flat list or split between activities/meals
    const allAiActivities = [
      ...(day.activities ?? []),
      ...(day.meals ?? []).map((m) => ({
        title: m.recommendation || 'Meal',
        location: m.location,
        type: 'restaurant',
        ...m,
      })),
    ];

    let sortOrder = 0;
    const activityCreates: Prisma.ItineraryActivityCreateWithoutDayInput[] =
      allAiActivities.map((activity: GeneratedActivity) => {
        const matchedAttraction = this.findAttractionForActivity(
          activity.placeId,
          activity.shortName || activity.title,
          activity.location,
          attractions,
        );

        const type =
          activity.type === 'restaurant' || activity.mealType
            ? ActivityType.MEAL
            : ActivityType.ATTRACTION;

        return {
          activityType: type,
          sortOrder: sortOrder++,
          title:
            activity.shortName ||
            activity.title ||
            matchedAttraction?.name ||
            'Spot',
          description:
            activity.description || matchedAttraction?.description || null,
          location: activity.location || matchedAttraction?.name || null,
          address: matchedAttraction?.address || null,
          startTime: activity.time || null,
          durationMinutes: this.parseDuration(activity.duration) || 90,
          cost: activity.cost || null,
          tips: activity.tips || null,
          latitude:
            activity.coordinates?.lat ||
            matchedAttraction?.location.lat ||
            null,
          longitude:
            activity.coordinates?.lng ||
            matchedAttraction?.location.lng ||
            null,
          placeId: activity.placeId || matchedAttraction?.id || null,
          mealType:
            activity.mealType ||
            (type === ActivityType.MEAL ? activity.type : null),
        };
      });

    return {
      dayNumber: day.day,
      date: dayDate,
      theme: day.theme || `Day ${day.day}: Exploration`,
      activities: { create: activityCreates },
      weather: {
        create: {
          condition:
            forecastDay?.condition ?? day.weather?.condition ?? 'clear',
          tempMin: forecastDay?.temperature.min ?? null,
          tempMax: forecastDay?.temperature.max ?? null,
          humidity: forecastDay?.humidity ?? null,
          windSpeed: forecastDay?.windSpeed ?? null,
          precipitation: forecastDay?.precipitation ?? null,
          recommendation: day.weather?.recommendations ?? null,
        },
      },
    };
  }

  private findAttractionForActivity(
    placeId: string | undefined,
    title: string | undefined,
    location: string | undefined,
    attractions: FormattedPlace[],
  ): FormattedPlace | undefined {
    if (placeId) {
      const byId = attractions.find((attraction) => attraction.id === placeId);
      if (byId) return byId;
    }

    const loweredTitle = title?.toLowerCase();
    if (loweredTitle) {
      const byTitle = attractions.find((attraction) =>
        attraction.name.toLowerCase().includes(loweredTitle),
      );
      if (byTitle) return byTitle;
    }

    const loweredLocation = location?.toLowerCase();
    if (loweredLocation) {
      return attractions.find((attraction) =>
        attraction.address.toLowerCase().includes(loweredLocation),
      );
    }

    return undefined;
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

  private buildTravelTimeContext(attractions: FormattedPlace[]): string {
    if (attractions.length < 2) {
      return 'Not enough attractions for travel time matrix.';
    }

    // Sort by popularity to pick key locations for context
    const routeAttractions = [...attractions]
      .sort(
        (a, b) =>
          b.rating - a.rating || b.userRatingsTotal - a.userRatingsTotal,
      )
      .slice(0, 8);

    const lines: string[] = [];
    for (let i = 0; i < routeAttractions.length; i++) {
      for (let j = i + 1; j < routeAttractions.length; j++) {
        const from = routeAttractions[i];
        const to = routeAttractions[j];
        const distanceKm = this.calculateHaversineDistance(
          from.location.lat,
          from.location.lng,
          to.location.lat,
          to.location.lng,
        );

        // Simple estimation: 2.5 mins per km in city + 5 mins buffer
        const durationMin = Math.round(distanceKm * 2.5 + 5);
        lines.push(
          `${from.name} -> ${to.name}: ~${durationMin} min (${distanceKm.toFixed(1)} km)`,
        );
      }
    }

    return lines.join('\n');
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
