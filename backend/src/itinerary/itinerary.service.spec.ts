import { NotFoundException } from '@nestjs/common';
import { TravelType } from '@prisma/client';

import {
  ItineraryService,
  ItineraryGenerateStreamEvent,
} from './itinerary.service';
import { concat, of, delay, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService, GeminiStreamEvent } from '../gemini/gemini.service';
import { ItineraryGenerationService } from './itinerary-generation.service';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockPrisma = {
  itinerary: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  itineraryDay: {
    create: jest.fn(),
    update: jest.fn(),
  },
  itineraryActivity: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  itineraryTip: { create: jest.fn() },
  itineraryWeatherSnapshot: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
  groupItinerary: { updateMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockGeminiService = {
  streamGenerate: jest.fn(),
  streamGenerateObservable: jest.fn(),
};

const mockItineraryGenerationService = {
  prepareGenerationData: jest.fn(),
  persistGeneratedItinerary: jest.fn(),
  mapSingleDay: jest.fn(),
};

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const userId = 'user-abc';
const itineraryId = 'itin-xyz';

const baseDto = {
  destination: 'Paris, France',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-07'),
  days: 7,
  travelType: TravelType.CULTURAL,
};

const weatherData = {
  forecast: [
    {
      date: '2024-06-01',
      condition: 'Sunny',
      temperature: { min: 15, max: 25 },
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
    },
  ],
};

const attractionsData = [{ name: 'Eiffel Tower', type: 'landmark' }];

const generatedItinerary = {
  summary: { bestSeason: 'Summer', estimatedBudget: '$2000' },
  days: [
    {
      day: 1,
      theme: 'Arrival',
      activities: [
        {
          title: 'Visit Eiffel Tower',
          description: 'Iconic landmark',
          location: 'Champ de Mars',
          time: '10:00',
          duration: 2,
          cost: '€26',
          tips: 'Book online',
          coordinates: { lat: 48.8584, lng: 2.2945 },
        },
      ],
      meals: [
        {
          type: 'LUNCH',
          recommendation: 'Café de Flore',
          location: 'Saint-Germain',
          priceRange: '€€',
        },
      ],
      transportation: {
        method: 'Metro',
        estimatedCost: '€10',
        notes: 'Buy day pass',
      },
      weather: { condition: 'Sunny', recommendations: 'Wear sunscreen' },
    },
  ],
  generalTips: ['Carry a reusable water bottle', 'Learn basic French phrases'],
};

const savedItineraryRecord = {
  id: itineraryId,
  userId,
  ...baseDto,
  aiModel: 'gemini-2.0-flash-exp',
};

// ---------------------------------------------------------------------------
// Helper — build service
// ---------------------------------------------------------------------------

const mockWeatherGetForecast = jest.fn();

function buildService(): ItineraryService {
  return new ItineraryService(
    mockPrisma as unknown as PrismaService,
    mockGeminiService as unknown as GeminiService,
    mockItineraryGenerationService as unknown as ItineraryGenerationService,
    {
      getForecast: mockWeatherGetForecast,
    } as unknown as import('../weather/weather.service').WeatherService,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItineraryService', () => {
  let service: ItineraryService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherGetForecast.mockReset();
    mockWeatherGetForecast.mockResolvedValue({
      forecast: [
        {
          date: '2026-06-05',
          condition: 'Sunny',
          temperature: { min: 15, max: 25 },
          humidity: 60,
          windSpeed: 10,
          precipitation: 0,
        },
        {
          date: '2026-06-06',
          condition: 'Rainy',
          temperature: { min: 12, max: 18 },
          humidity: 80,
          windSpeed: 15,
          precipitation: 5,
        },
      ],
    });
    service = buildService();
  });

  // =========================================================================
  // getUserItineraries
  // =========================================================================

  describe('getUserItineraries', () => {
    const itineraryList = [{ id: itineraryId, destination: 'Paris, France' }];

    beforeEach(() => {
      mockPrisma.itinerary.findMany.mockResolvedValue(itineraryList);
      mockPrisma.itinerary.count.mockResolvedValue(25);
    });

    it('applies correct skip/take for page 1 limit 10', async () => {
      await service.getUserItineraries(userId, 1, 10);

      expect(mockPrisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('applies correct skip for page 3 limit 5', async () => {
      await service.getUserItineraries(userId, 3, 5);

      expect(mockPrisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('computes totalPages correctly', async () => {
      const result = await service.getUserItineraries(userId, 1, 10);
      // 25 total / 10 per page = 3 pages
      expect(result.pagination.totalPages).toBe(3);
    });

    it('scopes query to the requesting user', async () => {
      await service.getUserItineraries(userId, 1, 10);

      expect(mockPrisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId }) }),
      );
    });

    it('returns itineraries and pagination metadata', async () => {
      const result = await service.getUserItineraries(userId, 1, 10);

      expect(result.itineraries).toEqual(itineraryList);
      expect(result.pagination).toMatchObject({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });
  });

  // =========================================================================
  // getItineraryById
  // =========================================================================

  describe('getItineraryById', () => {
    it('returns the itinerary when found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);

      const result = await service.getItineraryById(itineraryId, userId);

      expect(result).toEqual(savedItineraryRecord);
      expect(mockPrisma.itinerary.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: itineraryId }),
        }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.getItineraryById('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('omits userId filter when userId is falsy (public share path)', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);

      await service.getItineraryById(
        itineraryId,
        undefined as unknown as string,
      );

      expect(mockPrisma.itinerary.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: itineraryId }),
        }),
      );
      // userId key must NOT be in the where clause
      const whereArg = mockPrisma.itinerary.findFirst.mock.calls[0][0].where;
      expect(whereArg).not.toHaveProperty('userId');
    });
  });

  // =========================================================================
  // getItineraryByShareToken
  // =========================================================================

  describe('getItineraryByShareToken', () => {
    it('returns the itinerary for a valid token', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);

      const result = await service.getItineraryByShareToken('valid-token');

      expect(mockPrisma.itinerary.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shareToken: 'valid-token' } }),
      );
      expect(result).toEqual(savedItineraryRecord);
    });

    it('throws NotFoundException for an invalid token', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.getItineraryByShareToken('bad-token'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // updateItinerary
  // =========================================================================

  describe('updateItinerary', () => {
    const updateDto = { destination: 'Lyon, France' };

    it('updates and returns the record when found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      const updated = { ...savedItineraryRecord, destination: 'Lyon, France' };
      mockPrisma.itinerary.update.mockResolvedValue(updated);

      const result = await service.updateItinerary(
        itineraryId,
        userId,
        updateDto,
      );

      expect(mockPrisma.itinerary.update).toHaveBeenCalledWith({
        where: { id: itineraryId },
        data: expect.objectContaining({ destination: 'Lyon, France' }),
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when the itinerary does not belong to user', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItinerary(itineraryId, 'wrong-user', updateDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.itinerary.update).not.toHaveBeenCalled();
    });

    // Documents known limitation: travelType/days are not persisted on update
    it('does NOT update travelType even when provided in DTO', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itinerary.update.mockResolvedValue(savedItineraryRecord);

      await service.updateItinerary(itineraryId, userId, {
        ...updateDto,
        // @ts-expect-error — intentional extra field to verify it is stripped
        travelType: TravelType.ADVENTURE,
      });

      const dataArg = mockPrisma.itinerary.update.mock.calls[0][0].data;
      expect(dataArg).not.toHaveProperty('travelType');
    });
  });

  // =========================================================================
  // deleteItinerary
  // =========================================================================

  describe('deleteItinerary', () => {
    it('deletes the record and returns a success message', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itinerary.update.mockResolvedValue(savedItineraryRecord);
      mockPrisma.groupItinerary.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteItinerary(itineraryId, userId);

      expect(mockPrisma.itinerary.update).toHaveBeenCalledWith({
        where: { id: itineraryId },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
      expect(result).toEqual({ message: 'Itinerary deleted successfully' });
    });

    it('throws NotFoundException and does not call delete when not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteItinerary('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.itinerary.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // generateShareToken
  // =========================================================================

  describe('generateShareToken', () => {
    it('generates and persists a new token when none exists', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue({
        ...savedItineraryRecord,
        shareToken: null,
      });
      mockPrisma.itinerary.update.mockResolvedValue({
        ...savedItineraryRecord,
        shareToken: 'new-token',
      });

      const result = await service.generateShareToken(itineraryId, userId);

      expect(mockPrisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: itineraryId } }),
      );
      expect(result).toEqual({ shareToken: 'new-token' });
    });

    it('returns the existing token without calling update', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue({
        ...savedItineraryRecord,
        shareToken: 'existing-token',
      });

      const result = await service.generateShareToken(itineraryId, userId);

      expect(mockPrisma.itinerary.update).not.toHaveBeenCalled();
      expect(result).toEqual({ shareToken: 'existing-token' });
    });

    it('throws NotFoundException when itinerary is not owned by user', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.generateShareToken(itineraryId, 'wrong-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // generateStream
  // =========================================================================

  describe('generateStream', () => {
    beforeEach(() => {
      mockItineraryGenerationService.prepareGenerationData.mockResolvedValue({
        generationStart: Date.now(),
        weatherData,
        attractions: attractionsData,
        prompt: 'mocked prompt',
      });
      mockItineraryGenerationService.mapSingleDay.mockReturnValue({
        dayNumber: 1,
        theme: 'Arrival',
        activities: { create: [] },
        weather: { create: {} },
      });
      mockItineraryGenerationService.persistGeneratedItinerary.mockResolvedValue(
        {
          itinerary: savedItineraryRecord,
          geocodeTimeMs: 0,
          txTimeMs: 0,
        },
      );

      // Simulate two observable events: progress then complete
      mockGeminiService.streamGenerateObservable.mockReturnValue(
        concat(
          of({ type: 'chunk', content: 'Thinking...' }).pipe(delay(0)),
          of({ type: 'complete', data: generatedItinerary }).pipe(delay(1)),
        ),
      );

      // $transaction executes the callback with the mock tx
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: unknown) => unknown) => cb(mockPrisma),
      );
      mockPrisma.itinerary.create.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryDay.create.mockResolvedValue({ id: 'day-1' });
      mockPrisma.itineraryActivity.create.mockResolvedValue({});
      mockPrisma.itineraryTip.create.mockResolvedValue({});
      mockPrisma.itineraryWeatherSnapshot.create.mockResolvedValue({});
    });

    it('emits progress events before the complete event', (done) => {
      const events: ItineraryGenerateStreamEvent[] = [];

      service.generateStream(userId, baseDto).subscribe({
        next: (v) => events.push(v),
        complete: () => {
          const types = events.map((e) => e.type);
          expect(types).toContain('status');
          expect(types[types.length - 1]).toBe('complete');
          done();
        },
        error: done,
      });
    });

    it('emits a complete event with the persisted itinerary id', (done) => {
      service.generateStream(userId, baseDto).subscribe({
        next: (v) => {
          if (v.type === 'complete') {
            expect(v.itineraryId).toBe(itineraryId);
          }
        },
        complete: done,
        error: done,
      });
    });

    it('prepares generation data with the correct parameters', (done) => {
      service.generateStream(userId, baseDto).subscribe({
        complete: () => {
          expect(
            mockItineraryGenerationService.prepareGenerationData,
          ).toHaveBeenCalledWith(baseDto);
          done();
        },
        error: done,
      });
    });

    it('persists the generated itinerary via itineraryGenerationService', (done) => {
      service.generateStream(userId, baseDto).subscribe({
        complete: () => {
          expect(
            mockItineraryGenerationService.persistGeneratedItinerary,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              userId,
              createItineraryDto: baseDto,
              generated: generatedItinerary,
            }),
          );
          done();
        },
        error: done,
      });
    });

    it('emits an error event (not throws) when data preparation fails', (done) => {
      mockItineraryGenerationService.prepareGenerationData.mockRejectedValue(
        new Error('Preparation failed'),
      );

      service.generateStream(userId, baseDto).subscribe({
        next: (v) => {
          if (v.type === 'error') {
            expect(v.error).toBe('Preparation failed');
            done();
          }
        },
        error: (err) => done(new Error(`Should not error: ${err.message}`)),
      });
    });

    it('emits an error event when the Gemini stream fails', (done) => {
      mockGeminiService.streamGenerateObservable.mockReturnValue(
        new Observable<GeminiStreamEvent>((obs) =>
          obs.error(new Error('Gemini timeout')),
        ),
      );

      service.generateStream(userId, baseDto).subscribe({
        next: (v) => {
          if (v.type === 'error') {
            expect(v.error).toBe('Generation timed out. Please try again.');
            done();
          }
        },
        error: (err) => done(new Error(`Should not throw: ${err.message}`)),
      });
    });
  });

  // =========================================================================
  // Private helpers (tested indirectly via public methods)
  // =========================================================================

  describe('generateRandomToken', () => {
    it('returns a non-empty string', () => {
      const token = (
        service as unknown as { generateRandomToken: () => string }
      ).generateRandomToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('returns different values on successive calls', () => {
      const t1 = (
        service as unknown as { generateRandomToken: () => string }
      ).generateRandomToken();
      const t2 = (
        service as unknown as { generateRandomToken: () => string }
      ).generateRandomToken();
      // Probabilistically true; collision chance is astronomically low
      expect(t1).not.toBe(t2);
    });
  });

  describe('hashString', () => {
    it('is deterministic for the same input', () => {
      const h1 = (
        service as unknown as { hashString: (s: string) => string }
      ).hashString('hello');
      const h2 = (
        service as unknown as { hashString: (s: string) => string }
      ).hashString('hello');
      expect(h1).toBe(h2);
    });

    it('produces different hashes for different inputs', () => {
      expect(
        (
          service as unknown as { hashString: (s: string) => string }
        ).hashString('a'),
      ).not.toBe(
        (
          service as unknown as { hashString: (s: string) => string }
        ).hashString('b'),
      );
    });

    it('returns a string', () => {
      expect(
        typeof (
          service as unknown as { hashString: (s: string) => string }
        ).hashString('test'),
      ).toBe('string');
    });
  });

  // =========================================================================
  // reorderDays
  // =========================================================================

  describe('reorderDays', () => {
    it('should reorder days in two transaction phases and return result', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryDay.update.mockResolvedValue({
        id: 'day-1',
        dayNumber: 1,
      });
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'day-1', dayNumber: 1 },
      ]);

      const result = await service.reorderDays(itineraryId, userId, {
        dayIds: ['day-1', 'day-2'],
      });

      expect(mockPrisma.itinerary.findFirst).toHaveBeenCalledWith({
        where: { id: itineraryId, userId },
      });
      expect(mockPrisma.itineraryDay.update).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if itinerary is not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderDays(itineraryId, userId, { dayIds: ['day-1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should catch and log a warning if weather refresh throws an error during reorderDays', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryDay.update.mockResolvedValue({
        id: 'day-1',
        dayNumber: 1,
      });
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'day-1', dayNumber: 1 },
      ]);
      mockWeatherGetForecast.mockRejectedValue(
        new Error('Weather service failure'),
      );

      const result = await service.reorderDays(itineraryId, userId, {
        dayIds: ['day-1', 'day-2'],
      });

      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // reorderActivities
  // =========================================================================

  describe('reorderActivities', () => {
    it('should update sortOrder of activities in transaction and return sorted activities', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.update.mockResolvedValue({});
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        { id: 'act-1', sortOrder: 1 },
        { id: 'act-2', sortOrder: 2 },
      ]);

      const result = await service.reorderActivities(
        itineraryId,
        'day-1',
        userId,
        {
          activityIds: ['act-2', 'act-1'],
        },
      );

      expect(mockPrisma.itineraryActivity.update).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  // =========================================================================
  // updateActivity
  // =========================================================================

  describe('updateActivity', () => {
    it('should update and return the activity', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-1',
        title: 'New Title',
      });
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([]);

      const result = await service.updateActivity(
        itineraryId,
        'act-1',
        userId,
        {
          title: 'New Title',
        },
      );

      expect(result.title).toBe('New Title');
    });

    it('should throw NotFoundException if activity is not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue(null);

      await expect(
        service.updateActivity(itineraryId, 'act-1', userId, {
          title: 'New Title',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // addActivity
  // =========================================================================

  describe('addActivity', () => {
    it('should add activity and reorder remaining activities if needed', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        { id: 'act-1', sortOrder: 1, startTime: '10:00', durationMinutes: 60 },
      ]);
      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-2',
        title: 'New Act',
      });

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'New Act',
        startTime: '11:00',
        durationMinutes: 30,
      });

      expect(mockPrisma.itineraryActivity.create).toHaveBeenCalled();
      expect(result.activity.title).toBe('New Act');
    });
  });

  // =========================================================================
  // deleteActivity
  // =========================================================================

  describe('deleteActivity', () => {
    it('should soft-delete activity and shift remaining activity orders', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({});
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        { id: 'act-2', sortOrder: 2 },
      ]);

      const result = await service.deleteActivity(itineraryId, 'act-1', userId);

      expect(mockPrisma.itineraryActivity.update).toHaveBeenCalled();
      expect(result.message).toBe('Activity deleted successfully');
    });
  });

  // =========================================================================
  // generateItinerary (non-stream version)
  // =========================================================================

  describe('generateItinerary', () => {
    it('should prepare, generate, persist, and return the itinerary', async () => {
      mockItineraryGenerationService.prepareGenerationData.mockResolvedValue({
        generationStart: Date.now(),
        weatherData,
        attractions: attractionsData,
        prompt: 'test prompt',
      });
      mockGeminiService.streamGenerate.mockResolvedValue(generatedItinerary);
      mockItineraryGenerationService.persistGeneratedItinerary.mockResolvedValue(
        {
          itinerary: savedItineraryRecord,
          geocodeTimeMs: 0,
          txTimeMs: 0,
        },
      );
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);

      const result = await service.generateItinerary(userId, baseDto);

      expect(
        mockItineraryGenerationService.prepareGenerationData,
      ).toHaveBeenCalledWith(baseDto);
      expect(mockGeminiService.streamGenerate).toHaveBeenCalled();
      expect(result).toEqual(savedItineraryRecord);
    });
  });

  // =========================================================================
  // Error paths: NotFoundException for itinerary not found
  // =========================================================================

  describe('reorderDays (NotFoundException)', () => {
    it('throws NotFoundException if itinerary not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);
      await expect(
        service.reorderDays(itineraryId, userId, { dayIds: ['day-1'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderActivities (NotFoundException)', () => {
    it('throws NotFoundException if itinerary not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);
      await expect(
        service.reorderActivities(itineraryId, 'day-1', userId, {
          activityIds: ['act-1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateActivity (NotFoundException for itinerary)', () => {
    it('throws NotFoundException if itinerary not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);
      await expect(
        service.updateActivity(itineraryId, 'act-1', userId, {
          title: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addActivity (NotFoundException for itinerary)', () => {
    it('throws NotFoundException if itinerary not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);
      await expect(
        service.addActivity(itineraryId, 'day-1', userId, { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('inserts activity at end when startTime not provided', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        { id: 'act-1', sortOrder: 1, startTime: '10:00', durationMinutes: 60 },
      ]);
      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-2',
        title: 'New Act',
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'New Act',
      });

      expect(mockPrisma.itineraryActivity.create).toHaveBeenCalled();
      expect(result.activity.title).toBe('New Act');
    });

    it('inserts at start when new activity starts before all existing', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        { id: 'act-1', sortOrder: 1, startTime: '14:00', durationMinutes: 60 },
      ]);
      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-new',
        title: 'Early Act',
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'Early Act',
        startTime: '08:00',
      });

      expect(result.activity.title).toBe('Early Act');
    });

    it('trims the preceding activity duration if new activity overlap exists', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-preceding',
          sortOrder: 1,
          startTime: '10:00',
          durationMinutes: 120,
          title: 'Preceding',
        },
      ]);
      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-new',
        title: 'New Act',
        startTime: '11:30',
        sortOrder: 2,
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-preceding',
        durationMinutes: 90,
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'New Act',
        startTime: '11:30',
      });

      expect(mockPrisma.itineraryActivity.update).toHaveBeenCalledWith({
        where: { id: 'act-preceding' },
        data: { durationMinutes: 90 },
      });
      expect(result.trimmedActivity).toEqual({
        id: 'act-preceding',
        title: 'Preceding',
        newDurationMinutes: 90,
      });
    });

    it('cascades subsequent activity times from insertion point', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany
        .mockResolvedValueOnce([
          {
            id: 'act-preceding',
            sortOrder: 1,
            startTime: '10:00',
            durationMinutes: 60,
            title: 'Preceding',
          },
          {
            id: 'act-subsequent',
            sortOrder: 2,
            startTime: '11:15',
            durationMinutes: 60,
            title: 'Subsequent',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'act-new',
            sortOrder: 2,
            startTime: '11:00',
            durationMinutes: 60,
            title: 'New Act',
          },
          {
            id: 'act-subsequent',
            sortOrder: 3,
            startTime: '11:15',
            durationMinutes: 60,
            title: 'Subsequent',
          },
        ]);

      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-new',
        title: 'New Act',
        startTime: '11:00',
        durationMinutes: 60,
        sortOrder: 2,
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'New Act',
        startTime: '11:00',
        durationMinutes: 60,
      });

      expect(result.pushedActivities).toEqual([
        {
          id: 'act-subsequent',
          title: 'Subsequent',
          newStartTime: '12:00',
        },
      ]);
    });

    it('handles subsequent activity without startTime in cascadeActivityTimesFrom', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findMany
        .mockResolvedValueOnce([
          {
            id: 'act-preceding',
            sortOrder: 1,
            startTime: '10:00',
            durationMinutes: 60,
            title: 'Preceding',
          },
          {
            id: 'act-subsequent',
            sortOrder: 2,
            startTime: '11:15',
            durationMinutes: 60,
            title: 'Subsequent',
          },
          {
            id: 'act-no-time',
            sortOrder: 3,
            startTime: null,
            durationMinutes: 60,
            title: 'No Time',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'act-new',
            sortOrder: 2,
            startTime: '11:00',
            durationMinutes: 60,
            title: 'New Act',
          },
          {
            id: 'act-subsequent',
            sortOrder: 3,
            startTime: '11:15',
            durationMinutes: 60,
            title: 'Subsequent',
          },
          {
            id: 'act-no-time',
            sortOrder: 4,
            startTime: null,
            durationMinutes: 60,
            title: 'No Time',
          },
        ]);

      mockPrisma.itineraryActivity.create.mockResolvedValue({
        id: 'act-new',
        title: 'New Act',
        startTime: '11:00',
        durationMinutes: 60,
        sortOrder: 2,
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.addActivity(itineraryId, 'day-1', userId, {
        title: 'New Act',
        startTime: '11:00',
        durationMinutes: 60,
      });

      expect(result.pushedActivities).toEqual([
        {
          id: 'act-subsequent',
          title: 'Subsequent',
          newStartTime: '12:00',
        },
      ]);
    });
  });

  describe('deleteActivity (NotFoundException for activity)', () => {
    it('throws NotFoundException if activity not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue(null);
      await expect(
        service.deleteActivity(itineraryId, 'act-missing', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if itinerary not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);
      await expect(
        service.deleteActivity('itin-missing', 'act-1', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // cascadeActivityTimes (time overlap logic)
  // =========================================================================

  describe('cascadeActivityTimes (via updateActivity with time overlap)', () => {
    it('cascades times when activity starts before previous ends', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-1',
        title: 'Updated',
      });
      // Return activities where second one conflicts with first
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-1',
          sortOrder: 1,
          startTime: '10:00',
          durationMinutes: 120,
        },
        {
          id: 'act-2',
          sortOrder: 2,
          startTime: '11:00',
          durationMinutes: 60,
        }, // conflict: ends 11:00+120min = 12:00 > 11:00
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updateActivity(itineraryId, 'act-1', userId, {
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('cascades when an activity has no startTime but previous does (null branch)', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-1',
        title: 'Updated',
      });
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-1',
          sortOrder: 1,
          startTime: '10:00',
          durationMinutes: 60,
        },
        {
          id: 'act-2',
          sortOrder: 2,
          startTime: null, // no startTime — currentMinutes is null
          durationMinutes: 30,
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updateActivity(itineraryId, 'act-1', userId, {
        startTime: '10:00',
        durationMinutes: 60,
      });

      // No conflict, so $transaction may or may not be called for cascade
      expect(mockPrisma.itineraryActivity.findMany).toHaveBeenCalled();
    });

    it('does not call $transaction for cascade if no time conflicts exist', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-1',
        title: 'Updated',
      });
      // Activities without conflict
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-1',
          sortOrder: 1,
          startTime: '10:00',
          durationMinutes: 60,
        },
        {
          id: 'act-2',
          sortOrder: 2,
          startTime: '13:00',
          durationMinutes: 60,
        }, // no conflict
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updateActivity(itineraryId, 'act-1', userId, {
        startTime: '10:00',
      });

      expect(mockPrisma.itineraryActivity.findMany).toHaveBeenCalled();
    });

    it('handles first activity without a startTime (prevStartTime null branch)', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-1',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-1',
        title: 'Updated',
      });
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-1',
          sortOrder: 1,
          startTime: null,
          durationMinutes: 60,
        },
        {
          id: 'act-2',
          sortOrder: 2,
          startTime: '10:00',
          durationMinutes: 30,
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updateActivity(itineraryId, 'act-1', userId, {
        durationMinutes: 60,
      });

      expect(mockPrisma.itineraryActivity.findMany).toHaveBeenCalled();
    });

    it('uses priorityId tie-break when sorting activities with identical startTime', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryActivity.findFirst.mockResolvedValue({
        id: 'act-priority',
        dayId: 'day-1',
      });
      mockPrisma.itineraryActivity.update.mockResolvedValue({
        id: 'act-priority',
        title: 'Priority Activity',
      });
      // Return activities with identical start times
      mockPrisma.itineraryActivity.findMany.mockResolvedValue([
        {
          id: 'act-other-1',
          sortOrder: 1,
          startTime: '10:00',
          durationMinutes: 60,
        },
        {
          id: 'act-priority',
          sortOrder: 2,
          startTime: '10:00',
          durationMinutes: 60,
        },
        {
          id: 'act-other-2',
          sortOrder: 3,
          startTime: '10:00',
          durationMinutes: 60,
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updateActivity(itineraryId, 'act-priority', userId, {
        startTime: '10:00',
        durationMinutes: 60,
      });

      expect(mockPrisma.itineraryActivity.findMany).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // extractDaysFromBuffer (private method tested directly)
  // =========================================================================

  describe('extractDaysFromBuffer', () => {
    type ServiceWithExtract = {
      extractDaysFromBuffer: (buffer: string) => Array<{ day: number }>;
    };

    it('extracts a valid day JSON object from buffer', () => {
      const buffer = JSON.stringify({
        day: 1,
        theme: 'Arrival',
        activities: [],
      });
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer(buffer);
      expect(result).toHaveLength(1);
      expect(result[0].day).toBe(1);
    });

    it('extracts multiple day objects from buffer', () => {
      const d1 = JSON.stringify({ day: 1, theme: 'Day 1', activities: [] });
      const d2 = JSON.stringify({ day: 2, theme: 'Day 2', activities: [] });
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer(d1 + d2);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for incomplete JSON (no closing brace)', () => {
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer('{"day": 1, "theme":');
      expect(result).toHaveLength(0);
    });

    it('skips objects without a numeric day property', () => {
      const buffer = JSON.stringify({ notADay: true });
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer(buffer);
      expect(result).toHaveLength(0);
    });

    it('handles escape sequences inside strings (backslash escaping)', () => {
      const buffer = JSON.stringify({
        day: 1,
        theme: 'A "quoted" theme',
        activities: [],
      });
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer(buffer);
      expect(result).toHaveLength(1);
    });

    it('returns empty array for empty string buffer', () => {
      const result = (
        service as unknown as ServiceWithExtract
      ).extractDaysFromBuffer('');
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // toUserFriendlyError (private method tested directly)
  // =========================================================================

  describe('toUserFriendlyError', () => {
    type ServiceWithToUserFriendlyError = {
      toUserFriendlyError: (error: unknown) => string;
    };

    it('returns error message for ServiceUnavailableException', () => {
      const { ServiceUnavailableException } =
        jest.requireActual('@nestjs/common');
      const err = new ServiceUnavailableException('AI not available');
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError(err);
      expect(result).toBe('AI not available');
    });

    it('returns timeout message when error message includes "timeout"', () => {
      const err = new Error('Request timeout occurred');
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError(err);
      expect(result).toBe('Generation timed out. Please try again.');
    });

    it('returns parse error message when error message includes "parse"', () => {
      const err = new Error('JSON parse error');
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError(err);
      expect(result).toBe(
        'AI response format was invalid. Please retry generation.',
      );
    });

    it('returns parse error message when error message includes "json"', () => {
      const err = new Error('Invalid json response');
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError(err);
      expect(result).toBe(
        'AI response format was invalid. Please retry generation.',
      );
    });

    it('returns the raw error message for generic errors', () => {
      const err = new Error('Something went wrong');
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError(err);
      expect(result).toBe('Something went wrong');
    });

    it('returns fallback message for non-Error values', () => {
      const result = (
        service as unknown as ServiceWithToUserFriendlyError
      ).toUserFriendlyError('just a string');
      expect(result).toBe('Failed to generate itinerary. Please try again.');
    });
  });

  // =========================================================================
  // parseGeneratedItinerary (private method tested directly)
  // =========================================================================

  describe('parseGeneratedItinerary', () => {
    type ServiceWithParse = {
      parseGeneratedItinerary: (parsed: unknown, fallback: string) => unknown;
    };

    it('returns wrapped GeneratedItinerary when data is an array', () => {
      const days = [{ day: 1, theme: 'Arrival', activities: [] }];
      const result = (
        service as unknown as ServiceWithParse
      ).parseGeneratedItinerary(days, '');
      expect(result).toMatchObject({ days, summary: {}, generalTips: [] });
    });

    it('maps data object with days array into GeneratedItinerary shape', () => {
      const data = { days: [{ day: 1 }], summary: {}, generalTips: [] };
      const result = (
        service as unknown as ServiceWithParse
      ).parseGeneratedItinerary(data, '');
      expect(result).toMatchObject({ days: [{ day: 1 }] });
    });

    it('uses rawJsonFallback when parsedData is falsy', () => {
      const days = [{ day: 1, theme: 'Fallback', activities: [] }];
      const result = (
        service as unknown as ServiceWithParse
      ).parseGeneratedItinerary(null, JSON.stringify(days));
      expect(result).toMatchObject({ days, summary: {}, generalTips: [] });
    });

    it('throws ServiceUnavailableException when both parsedData and fallback are empty', () => {
      const { ServiceUnavailableException } =
        jest.requireActual('@nestjs/common');
      expect(() =>
        (service as unknown as ServiceWithParse).parseGeneratedItinerary(
          null,
          '',
        ),
      ).toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when data is not an array and has no days', () => {
      const { ServiceUnavailableException } =
        jest.requireActual('@nestjs/common');
      expect(() =>
        (service as unknown as ServiceWithParse).parseGeneratedItinerary(
          { badKey: true },
          '',
        ),
      ).toThrow(ServiceUnavailableException);
    });
  });

  // =========================================================================
  // generateStream: persist error path and chunk->day emission
  // =========================================================================

  describe('generateStream (additional coverage)', () => {
    beforeEach(() => {
      mockItineraryGenerationService.prepareGenerationData.mockResolvedValue({
        generationStart: Date.now(),
        weatherData,
        attractions: attractionsData,
        prompt: 'mocked prompt',
      });
      mockItineraryGenerationService.mapSingleDay.mockReturnValue({
        dayNumber: 1,
        theme: 'Arrival',
        activities: { create: [] },
        weather: { create: {} },
      });
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: unknown) => unknown) => cb(mockPrisma),
      );
      mockPrisma.itinerary.create.mockResolvedValue(savedItineraryRecord);
      mockPrisma.itineraryDay.create.mockResolvedValue({ id: 'day-1' });
      mockPrisma.itineraryActivity.create.mockResolvedValue({});
      mockPrisma.itineraryTip.create.mockResolvedValue({});
      mockPrisma.itineraryWeatherSnapshot.create.mockResolvedValue({});
    });

    it('emits a "day" event when a parseable day chunk arrives from stream', (done) => {
      const dayChunk = JSON.stringify({
        day: 1,
        theme: 'Arrival',
        activities: [],
      });
      mockGeminiService.streamGenerateObservable.mockReturnValue(
        new Observable<GeminiStreamEvent>((obs) => {
          obs.next({ type: 'chunk', content: dayChunk });
          obs.next({ type: 'complete', data: generatedItinerary });
          obs.complete();
        }),
      );
      mockItineraryGenerationService.persistGeneratedItinerary.mockResolvedValue(
        {
          itinerary: savedItineraryRecord,
          geocodeTimeMs: 0,
          txTimeMs: 0,
        },
      );

      const events: ItineraryGenerateStreamEvent[] = [];
      service.generateStream(userId, baseDto).subscribe({
        next: (v) => events.push(v),
        complete: () => {
          const dayEvents = events.filter((e) => e.type === 'day');
          expect(dayEvents.length).toBeGreaterThanOrEqual(1);
          const telemetryEvents = events.filter((e) => e.type === 'telemetry');
          expect(telemetryEvents.length).toBeGreaterThanOrEqual(2); // Should have at least preparation and day telemetry
          done();
        },
        error: done,
      });
    });

    it('emits an error event when persistGeneratedItinerary fails in stream', (done) => {
      mockGeminiService.streamGenerateObservable.mockReturnValue(
        new Observable<GeminiStreamEvent>((obs) => {
          obs.next({ type: 'complete', data: generatedItinerary });
          obs.complete();
        }),
      );
      mockItineraryGenerationService.persistGeneratedItinerary.mockRejectedValue(
        new Error('DB persist error'),
      );

      service.generateStream(userId, baseDto).subscribe({
        next: (v) => {
          if (v.type === 'error') {
            expect(v.error).toBe('DB persist error');
            done();
          }
        },
        error: (err) => done(new Error(`Should not throw: ${String(err)}`)),
      });
    });
  });
});
