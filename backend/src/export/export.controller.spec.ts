import { Response } from 'express';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { JwtPayload } from '../common/types/jwt-payload.type';

describe('ExportController', () => {
  let controller: ExportController;
  let service: jest.Mocked<ExportService>;
  let mockResponse: Partial<Response>;

  const mockUser: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'authenticated',
    user_metadata: {},
    app_metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = {
      exportToIcs: jest.fn(),
      getExportUrl: jest.fn(),
    } as unknown as jest.Mocked<ExportService>;

    controller = new ExportController(service);

    mockResponse = {
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('exportIcs', () => {
    it('should generate ICS and send download response for private itinerary', async () => {
      const mockBuffer = Buffer.from('BEGIN:VCALENDAR...');
      service.exportToIcs.mockResolvedValue(mockBuffer);

      await controller.exportIcs('itin-123', mockUser, mockResponse as Response);

      expect(service.exportToIcs).toHaveBeenCalledWith('itin-123', 'user-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="routiq-itinerary-itin-123.ics"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should send 500 error if ICS generation throws error', async () => {
      service.exportToIcs.mockRejectedValue(new Error('ICS Error'));

      await controller.exportIcs('itin-123', mockUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to generate ICS file',
          statusCode: 500,
        },
      });
    });
  });

  describe('exportSharedIcs', () => {
    it('should generate ICS and send download response for shared itinerary', async () => {
      const mockBuffer = Buffer.from('BEGIN:VCALENDAR...');
      service.exportToIcs.mockResolvedValue(mockBuffer);

      await controller.exportSharedIcs('itin-123', mockResponse as Response);

      expect(service.exportToIcs).toHaveBeenCalledWith('itin-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar');
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should send 500 error if shared ICS generation throws', async () => {
      service.exportToIcs.mockRejectedValue(new Error('ICS Error'));

      await controller.exportSharedIcs('itin-123', mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to generate ICS file',
          statusCode: 500,
        },
      });
    });
  });
});
