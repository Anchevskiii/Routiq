import { of, throwError } from 'rxjs';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { TravelType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { sub: 'user-123', email: 'test@example.com' };

const mockItinerary = {
  id: 'itin-1',
  userId: 'user-123',
  destination: 'Paris, France',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-07'),
  travelType: TravelType.CULTURAL,
  totalDays: 7,
  isPublic: false,
  shareToken: null,
  bestSeason: 'Summer',
  estimatedBudget: '$2000',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockItineraryService = {
  generateStream: jest.fn(),
  getUserItineraries: jest.fn(),
  getItineraryById: jest.fn(),
  updateItinerary: jest.fn(),
  deleteItinerary: jest.fn(),
  generateShareToken: jest.fn(),
  getItineraryByShareToken: jest.fn(),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ItineraryController', () => {
  let controller: ItineraryController;

  function buildSseMocks() {
    const handlers: Record<string, () => void> = {};
    const req = {
      on: jest.fn((event: string, handler: () => void) => {
        handlers[event] = handler;
      }),
    };
    let res: {
      writableEnded: boolean;
      status: jest.Mock;
      setHeader: jest.Mock;
      flushHeaders: jest.Mock;
      write: jest.Mock;
      end: jest.Mock;
    };
    res = {
      writableEnded: false,
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(() => {
        res.writableEnded = true;
      }),
    };
    return { req, res, handlers };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ItineraryController(
      mockItineraryService as unknown as ItineraryService,
    );
  });

  // -------------------------------------------------------------------------
  // generateItinerary
  // -------------------------------------------------------------------------

  describe('generateItinerary', () => {
    const dto: CreateItineraryDto = {
      destination: 'Paris, France',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-07'),
      days: 7,
      travelType: TravelType.CULTURAL,
    };

    it('writes each emission to the SSE response', async () => {
      const events = [
        { type: 'progress', message: 'Generating...' },
        { type: 'complete', itineraryId: 'itin-1' },
      ];
      mockItineraryService.generateStream.mockReturnValue(of(...events));

      const { req, res } = buildSseMocks();

      await controller.generateItinerary(
        mockUser,
        dto,
        req as any,
        res as any,
      );

      expect(res.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(events[0])}\n\n`,
      );
      expect(res.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(events[1])}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
      expect(mockItineraryService.generateStream).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
      );
    });

    it('writes a generic error event when the stream errors', async () => {
      mockItineraryService.generateStream.mockReturnValue(
        throwError(() => new Error('AI failure')),
      );

      const { req, res } = buildSseMocks();

      await controller.generateItinerary(
        mockUser,
        dto,
        req as any,
        res as any,
      );

      expect(res.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          type: 'error',
          error: 'Streaming connection failed',
        })}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getUserItineraries
  // -------------------------------------------------------------------------

  describe('getUserItineraries', () => {
    const paginatedResult = {
      itineraries: [mockItinerary],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    it('returns data and meta with default page/limit when query params are absent', async () => {
      mockItineraryService.getUserItineraries.mockResolvedValue(paginatedResult);

      const result = await controller.getUserItineraries(
        mockUser,
        undefined as unknown as string,
        undefined as unknown as string,
      );

      expect(mockItineraryService.getUserItineraries).toHaveBeenCalledWith(
        'user-123',
        1,   // default page
        10,  // default limit
      );
      expect(result).toEqual({
        data: paginatedResult.itineraries,
        meta: paginatedResult.pagination,
      });
    });

    it('parses string query params into integers', async () => {
      mockItineraryService.getUserItineraries.mockResolvedValue(paginatedResult);

      await controller.getUserItineraries(mockUser, '3', '5');

      expect(mockItineraryService.getUserItineraries).toHaveBeenCalledWith(
        'user-123',
        3,
        5,
      );
    });

    it('uses the authenticated user id, not a user-supplied value', async () => {
      mockItineraryService.getUserItineraries.mockResolvedValue(paginatedResult);

      await controller.getUserItineraries(mockUser, '1', '10');

      const [calledUserId] =
        mockItineraryService.getUserItineraries.mock.calls[0];
      expect(calledUserId).toBe(mockUser.sub);
    });
  });

  // -------------------------------------------------------------------------
  // getItineraryById
  // -------------------------------------------------------------------------

  describe('getItineraryById', () => {
    it('delegates to service with id and user.sub', async () => {
      mockItineraryService.getItineraryById.mockResolvedValue(mockItinerary);

      const result = await controller.getItineraryById('itin-1', mockUser);

      expect(mockItineraryService.getItineraryById).toHaveBeenCalledWith(
        'itin-1',
        'user-123',
      );
      expect(result).toEqual(mockItinerary);
    });

    it('surfaces NotFoundException from the service', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockItineraryService.getItineraryById.mockRejectedValue(
        new NotFoundException('Itinerary not found'),
      );

      await expect(
        controller.getItineraryById('nonexistent', mockUser),
      ).rejects.toThrow('Itinerary not found');
    });
  });

  // -------------------------------------------------------------------------
  // updateItinerary
  // -------------------------------------------------------------------------

  describe('updateItinerary', () => {
    const updateDto: UpdateItineraryDto = {
      destination: 'Lyon, France',
    };

    it('delegates to service and returns the updated record', async () => {
      const updated = { ...mockItinerary, destination: 'Lyon, France' };
      mockItineraryService.updateItinerary.mockResolvedValue(updated);

      const result = await controller.updateItinerary(
        'itin-1',
        mockUser,
        updateDto,
      );

      expect(mockItineraryService.updateItinerary).toHaveBeenCalledWith(
        'itin-1',
        'user-123',
        updateDto,
      );
      expect(result).toEqual(updated);
    });

    it('surfaces NotFoundException when itinerary is not owned by user', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockItineraryService.updateItinerary.mockRejectedValue(
        new NotFoundException('Itinerary not found'),
      );

      await expect(
        controller.updateItinerary('other-itin', mockUser, updateDto),
      ).rejects.toThrow('Itinerary not found');
    });
  });

  // -------------------------------------------------------------------------
  // deleteItinerary
  // -------------------------------------------------------------------------

  describe('deleteItinerary', () => {
    it('returns success message on successful deletion', async () => {
      mockItineraryService.deleteItinerary.mockResolvedValue({
        message: 'Itinerary deleted successfully',
      });

      const result = await controller.deleteItinerary('itin-1', mockUser);

      expect(mockItineraryService.deleteItinerary).toHaveBeenCalledWith(
        'itin-1',
        'user-123',
      );
      expect(result).toEqual({ message: 'Itinerary deleted successfully' });
    });

    it('surfaces NotFoundException when itinerary does not belong to user', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockItineraryService.deleteItinerary.mockRejectedValue(
        new NotFoundException('Itinerary not found'),
      );

      await expect(
        controller.deleteItinerary('other-itin', mockUser),
      ).rejects.toThrow('Itinerary not found');
    });
  });

  // -------------------------------------------------------------------------
  // generateShareToken
  // -------------------------------------------------------------------------

  describe('generateShareToken', () => {
    it('returns a share token for a valid owned itinerary', async () => {
      mockItineraryService.generateShareToken.mockResolvedValue({
        shareToken: 'abc123xyz',
      });

      const result = await controller.generateShareToken('itin-1', mockUser);

      expect(mockItineraryService.generateShareToken).toHaveBeenCalledWith(
        'itin-1',
        'user-123',
      );
      expect(result).toEqual({ shareToken: 'abc123xyz' });
    });

    it('returns the existing token if one already exists', async () => {
      // Service dedups: if token already present it returns the existing one.
      mockItineraryService.generateShareToken.mockResolvedValue({
        shareToken: 'existing-token',
      });

      const result = await controller.generateShareToken('itin-1', mockUser);

      expect(result).toEqual({ shareToken: 'existing-token' });
      // Expect service called exactly once — no double-generation
      expect(mockItineraryService.generateShareToken).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // getSharedItinerary  (public endpoint — no auth required)
  // -------------------------------------------------------------------------

  describe('getSharedItinerary', () => {
    it('delegates to service with shareToken only', async () => {
      mockItineraryService.getItineraryByShareToken.mockResolvedValue(
        mockItinerary,
      );

      const result = await controller.getSharedItinerary('abc123xyz');

      expect(
        mockItineraryService.getItineraryByShareToken,
      ).toHaveBeenCalledWith('abc123xyz');
      expect(result).toEqual(mockItinerary);
    });

    it('surfaces NotFoundException for an unknown share token', async () => {
      const { NotFoundException } = jest.requireActual('@nestjs/common');
      mockItineraryService.getItineraryByShareToken.mockRejectedValue(
        new NotFoundException('Itinerary not found'),
      );

      await expect(
        controller.getSharedItinerary('bad-token'),
      ).rejects.toThrow('Itinerary not found');
    });
  });
});