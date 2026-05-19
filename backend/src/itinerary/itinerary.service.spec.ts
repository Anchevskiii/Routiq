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
  itineraryDay: { create: jest.fn() },
  itineraryActivity: { create: jest.fn() },
  itineraryTip: { create: jest.fn() },
  itineraryWeatherSnapshot: { create: jest.fn() },
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

function buildService(): ItineraryService {
  return new ItineraryService(
    mockPrisma as unknown as PrismaService,
    mockGeminiService as unknown as GeminiService,
    mockItineraryGenerationService as unknown as ItineraryGenerationService,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ItineraryService', () => {
  let service: ItineraryService;

  beforeEach(() => {
    jest.clearAllMocks();
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
        expect.objectContaining({ where: { userId } }),
      );
    });

    it('returns itineraries and pagination metadata', async () => {
      const result = await service.getUserItineraries(userId, 1, 10);

      expect(result.itineraries).toEqual(itineraryList);
      expect(result.pagination).toEqual({
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
          where: { id: itineraryId, userId },
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
        expect.objectContaining({ where: { id: itineraryId } }),
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
      mockPrisma.itinerary.delete.mockResolvedValue(savedItineraryRecord);

      const result = await service.deleteItinerary(itineraryId, userId);

      expect(mockPrisma.itinerary.delete).toHaveBeenCalledWith({
        where: { id: itineraryId },
      });
      expect(result).toEqual({ message: 'Itinerary deleted successfully' });
    });

    it('throws NotFoundException and does not call delete when not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteItinerary('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.itinerary.delete).not.toHaveBeenCalled();
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
        savedItineraryRecord,
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
});
