import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ExportService } from './export.service';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':id/ics')
  @UseGuards(JwtAuthGuard)
  async exportIcs(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() response: Response,
  ) {
    try {
      const icsBuffer = await this.exportService.exportToIcs(id, user.sub);

      response.setHeader('Content-Type', 'text/calendar');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="routiq-itinerary-${id}.ics"`,
      );
      response.send(icsBuffer);
    } catch {
      response.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to generate ICS file',
          statusCode: 500,
        },
      });
    }
  }

  @Public()
  @Get('shared/:id/ics')
  async exportSharedIcs(@Param('id') id: string, @Res() response: Response) {
    try {
      const icsBuffer = await this.exportService.exportToIcs(id);

      response.setHeader('Content-Type', 'text/calendar');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="routiq-itinerary-${id}.ics"`,
      );
      response.send(icsBuffer);
    } catch {
      response.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to generate ICS file',
          statusCode: 500,
        },
      });
    }
  }
}
