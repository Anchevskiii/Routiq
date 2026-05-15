import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { ItineraryThrottlerGuard } from './guards/itinerary-throttler.guard';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ItineraryService } from './itinerary.service';

@Controller('itinerary')
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Throttle({ 'itinerary-generate': { limit: 5, ttl: 60000 } })
  @UseGuards(ItineraryThrottlerGuard)
  @Post('generate')
  async generateItinerary(
    @CurrentUser() user: JwtPayload,
    @Body() createItineraryDto: CreateItineraryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = this.itineraryService.generateStream(
      user.sub,
      createItineraryDto,
    );
    const subscription = stream.subscribe({
      next: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: () => {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: 'Streaming connection failed',
            })}\n\n`,
          );
          res.end();
        }
      },
      complete: () => {
        if (!res.writableEnded) {
          res.end();
        }
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
      if (!res.writableEnded) {
        res.end();
      }
    });
  }

  @Get()
  async getUserItineraries(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.itineraryService.getUserItineraries(
      user.sub,
      pageNum,
      limitNum,
    );

    return {
      data: result.itineraries,
      meta: result.pagination,
    };
  }

  @Get(':id')
  async getItineraryById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.getItineraryById(id, user.sub);
  }

  @Patch(':id')
  async updateItinerary(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateItineraryDto: UpdateItineraryDto,
  ) {
    return this.itineraryService.updateItinerary(
      id,
      user.sub,
      updateItineraryDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteItinerary(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.deleteItinerary(id, user.sub);
  }

  @Post(':id/share')
  async generateShareToken(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.generateShareToken(id, user.sub);
  }

  @Public()
  @Get('shared/:shareToken')
  async getSharedItinerary(@Param('shareToken') shareToken: string) {
    return this.itineraryService.getItineraryByShareToken(shareToken);
  }
}
