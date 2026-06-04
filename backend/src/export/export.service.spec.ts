import { NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  itinerary: {
    findFirst: jest.fn(),
  },
  calendarExport: {
    create: jest.fn(),
  },
};

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportService(mockPrisma as unknown as PrismaService);
  });

  describe('exportToIcs', () => {
    it('should throw NotFoundException if itinerary is not found', async () => {
      mockPrisma.itinerary.findFirst.mockResolvedValue(null);

      await expect(
        service.exportToIcs('invalid-id', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate ICS file and log the export if user ID is provided', async () => {
      const mockItinerary = {
        id: 'itin-123',
        destination: 'Paris',
        days: [
          {
            dayNumber: 1,
            date: new Date('2026-06-04'),
            activities: [
              {
                title: 'Eiffel Tower',
                description: 'Visit the landmark',
                location: 'Paris',
                startTime: '10:00',
                durationMinutes: 120,
                activityType: ActivityType.ATTRACTION,
                sortOrder: 1,
              },
            ],
          },
        ],
      };

      mockPrisma.itinerary.findFirst.mockResolvedValue(mockItinerary);
      mockPrisma.calendarExport.create.mockResolvedValue({});

      const buffer = await service.exportToIcs('itin-123', 'user-123');

      expect(mockPrisma.itinerary.findFirst).toHaveBeenCalled();
      expect(mockPrisma.calendarExport.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          itineraryId: 'itin-123',
          format: 'ICS',
        },
      });
      expect(buffer).toBeInstanceOf(Buffer);
      const icsString = buffer.toString();
      expect(icsString).toContain('BEGIN:VCALENDAR');
      expect(icsString).toContain('Eiffel Tower');
    });

    it('should handle activities without startTime or durationMinutes and use defaults', async () => {
      const mockItinerary = {
        id: 'itin-123',
        destination: 'Paris',
        days: [
          {
            dayNumber: 1,
            date: new Date('2026-06-04'),
            activities: [
              {
                title: 'Notre Dame',
                description: null,
                location: null,
                startTime: null,
                durationMinutes: null,
                activityType: ActivityType.ATTRACTION,
                sortOrder: 1,
              },
            ],
          },
        ],
      };

      mockPrisma.itinerary.findFirst.mockResolvedValue(mockItinerary);

      const buffer = await service.exportToIcs('itin-123');

      expect(mockPrisma.calendarExport.create).not.toHaveBeenCalled(); // No userId, no log
      expect(buffer).toBeInstanceOf(Buffer);
      const icsString = buffer.toString();
      expect(icsString).toContain('Notre Dame');
    });
  });

  describe('getExportUrl', () => {
    it('should return export URL using FRONTEND_URL environment variable', async () => {
      process.env.FRONTEND_URL = 'https://my-frontend.com';
      const url = await service.getExportUrl('itin-123');
      expect(url).toBe('https://my-frontend.com/api/export/itin-123/ics');
    });
  });
});
