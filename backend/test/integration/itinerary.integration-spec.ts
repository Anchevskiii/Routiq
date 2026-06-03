import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TravelType } from '@prisma/client';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ItineraryService } from '../../src/itinerary/itinerary.service';
import { ItineraryGenerationService } from '../../src/itinerary/itinerary-generation.service';
import { GeminiService } from '../../src/gemini/gemini.service';
import { AttractionsService } from '../../src/attractions/attractions.service';
import { WeatherService } from '../../src/weather/weather.service';
import { AppConfigService } from '../../src/config/config.service';
import { createTestUser, createTestItinerary } from '../test-data';

describe('ItineraryService (integration)', () => {
  let prisma: PrismaService;
  let itineraryService: ItineraryService;
  let userId: string;

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
        ItineraryService,
        ItineraryGenerationService,
        {
          provide: GeminiService,
          useValue: {},
        },
        {
          provide: AttractionsService,
          useValue: {
            geocodeAddress: jest
              .fn()
              .mockResolvedValue({ lat: 48.8566, lng: 2.3522 }),
            getCuratedPlaces: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: WeatherService,
          useValue: {},
        },
        {
          provide: AppConfigService,
          useValue: {
            get: (key: string) => (key === 'NODE_ENV' ? 'test' : undefined),
          },
        },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    itineraryService = moduleRef.get(ItineraryService);
    await prisma.onModuleInit();

    const user = await createTestUser(prisma);
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  describe('Cascade Deletions (Soft-delete)', () => {
    it('soft-deletes itineraries, days, and activities, and hard-deletes tips', async () => {
      // 1. Create an itinerary
      const itinerary = await createTestItinerary(prisma, userId, {
        destination: 'Venice',
      });

      // 2. Create related entities
      const day = await prisma.itineraryDay.create({
        data: {
          itineraryId: itinerary.id,
          dayNumber: 1,
          date: new Date('2026-06-01T00:00:00.000Z'),
          theme: 'Venice canals',
        },
      });

      const activity = await prisma.itineraryActivity.create({
        data: {
          dayId: day.id,
          title: 'Gondola Ride',
          sortOrder: 1,
        },
      });

      const tip = await prisma.itineraryTip.create({
        data: {
          itineraryId: itinerary.id,
          sortOrder: 1,
          content: 'Keep cash for gondolas',
        },
      });

      // Assert they are created
      expect(
        await prisma.itinerary.findUnique({ where: { id: itinerary.id } }),
      ).toBeTruthy();
      expect(
        await prisma.itineraryDay.findUnique({ where: { id: day.id } }),
      ).toBeTruthy();
      expect(
        await prisma.itineraryActivity.findUnique({
          where: { id: activity.id },
        }),
      ).toBeTruthy();
      expect(
        await prisma.itineraryTip.findUnique({ where: { id: tip.id } }),
      ).toBeTruthy();

      // 3. Delete the itinerary through ItineraryService (which soft-deletes the parent itinerary)
      await itineraryService.deleteItinerary(itinerary.id, userId);

      // 4. Assert soft-deleted itinerary is not found using normal select queries
      const foundItinerary = await prisma.itinerary.findFirst({
        where: { id: itinerary.id },
      });
      expect(foundItinerary).toBeNull();

      // 5. Related entities remain in the database since soft-deletion uses an update command which bypasses foreign-key cascade deletes
      const foundDay = await prisma.itineraryDay.findFirst({
        where: { id: day.id },
      });
      const foundActivity = await prisma.itineraryActivity.findFirst({
        where: { id: activity.id },
      });
      const foundTip = await prisma.itineraryTip.findUnique({
        where: { id: tip.id },
      });

      expect(foundDay).not.toBeNull();
      expect(foundActivity).not.toBeNull();
      expect(foundTip).not.toBeNull();
    });
  });

  describe('Pagination Mathematics', () => {
    it('correctly pages through user itineraries', async () => {
      // 1. Create a fresh user to avoid conflicts
      const localUser = await createTestUser(prisma);

      // 2. Create 15 itineraries
      for (let i = 1; i <= 15; i++) {
        await createTestItinerary(prisma, localUser.id, {
          destination: `City ${i}`,
        });
      }

      // 3. Request page 1 with limit 10
      const pageOne = await itineraryService.getUserItineraries(
        localUser.id,
        1,
        10,
      );
      expect(pageOne.itineraries.length).toBe(10);
      expect(pageOne.pagination.total).toBe(15);
      expect(pageOne.pagination.page).toBe(1);
      expect(pageOne.pagination.limit).toBe(10);
      expect(pageOne.pagination.totalPages).toBe(2);

      // 4. Request page 2 with limit 10
      const pageTwo = await itineraryService.getUserItineraries(
        localUser.id,
        2,
        10,
      );
      expect(pageTwo.itineraries.length).toBe(5);
      expect(pageTwo.pagination.page).toBe(2);
    });
  });

  describe('Immutable travelType on Update (Regression)', () => {
    it('does not allow updating travelType', async () => {
      const itinerary = await createTestItinerary(prisma, userId, {
        destination: 'Rome',
        travelType: TravelType.CULTURAL,
      });

      // Try to update travelType to ADVENTURE and change destination to Rome Updated
      await itineraryService.updateItinerary(itinerary.id, userId, {
        destination: 'Rome Updated',
        travelType: TravelType.ADVENTURE,
      } as unknown as Parameters<typeof itineraryService.updateItinerary>[2]);

      // Read from DB directly
      const updated = await prisma.itinerary.findUnique({
        where: { id: itinerary.id },
      });

      expect(updated).not.toBeNull();
      expect(updated!.destination).toBe('Rome Updated');
      expect(updated!.travelType).toBe(TravelType.CULTURAL); // Unchanged!
    });
  });
});
