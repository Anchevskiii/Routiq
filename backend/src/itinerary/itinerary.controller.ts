import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { ServerResponse } from 'http';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ItineraryService } from './itinerary.service';

@Controller('itinerary')
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateItinerary(
    @CurrentUser() user: JwtPayload,
    @Body() createItineraryDto: CreateItineraryDto,
    @Res() response: Response & ServerResponse,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const itinerary = await this.itineraryService.generateItinerary(
        user.sub,
        createItineraryDto,
      );

      // Send the final itinerary ID in the last event
      response.write(
        `data: ${JSON.stringify({
          type: 'complete',
          itineraryId: itinerary.id,
        })}\n\n`,
      );

      response.end();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      response.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: errorMessage,
        })}\n\n`,
      );
      response.end();
    }
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
