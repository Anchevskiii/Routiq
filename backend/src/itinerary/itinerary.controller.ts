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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ReorderDaysDto } from './dto/reorder-days.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ItineraryService } from './itinerary.service';

@ApiTags('Itinerary')
@ApiBearerAuth()
@Controller('itinerary')
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @ApiOperation({
    summary: 'Generate a travel itinerary',
    description:
      'Generates an itinerary using Gemini and streams updates via SSE.',
  })
  @ApiBody({ type: CreateItineraryDto })
  @ApiResponse({
    status: 200,
    description: 'Itinerary generated and streamed successfully.',
  })
  @Throttle({ 'itinerary-generate': { limit: 5, ttl: 60000 } })
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

  @ApiOperation({ summary: 'Get current user itineraries' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of itineraries.',
  })
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

  @ApiOperation({ summary: 'Get itinerary by ID' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiResponse({ status: 200, description: 'Returns the itinerary details.' })
  @ApiResponse({ status: 404, description: 'Itinerary not found.' })
  @Get(':id')
  async getItineraryById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.getItineraryById(id, user.sub);
  }

  @ApiOperation({ summary: 'Update itinerary details' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiBody({ type: UpdateItineraryDto })
  @ApiResponse({ status: 200, description: 'Itinerary updated successfully.' })
  @ApiResponse({ status: 404, description: 'Itinerary not found.' })
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

  @ApiOperation({ summary: 'Delete itinerary (soft delete)' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiResponse({ status: 200, description: 'Itinerary deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Itinerary not found.' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteItinerary(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.deleteItinerary(id, user.sub);
  }

  @ApiOperation({ summary: 'Generate share token for itinerary' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiResponse({ status: 200, description: 'Returns the share token.' })
  @ApiResponse({ status: 404, description: 'Itinerary not found.' })
  @Post(':id/share')
  async generateShareToken(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.generateShareToken(id, user.sub);
  }

  @ApiOperation({ summary: 'Get shared itinerary by share token' })
  @ApiParam({ name: 'shareToken', description: 'Itinerary share token' })
  @ApiResponse({
    status: 200,
    description: 'Returns the shared itinerary details.',
  })
  @ApiResponse({ status: 404, description: 'Itinerary not found.' })
  @Public()
  @Get('shared/:shareToken')
  async getSharedItinerary(@Param('shareToken') shareToken: string) {
    return this.itineraryService.getItineraryByShareToken(shareToken);
  }

  @ApiOperation({ summary: 'Reorder days in itinerary' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiBody({ type: ReorderDaysDto })
  @ApiResponse({ status: 200, description: 'Days reordered successfully.' })
  @Put(':id/days/reorder')
  async reorderDays(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() reorderDaysDto: ReorderDaysDto,
  ) {
    return this.itineraryService.reorderDays(id, user.sub, reorderDaysDto);
  }

  @ApiOperation({ summary: 'Reorder activities within a specific day' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiParam({ name: 'dayId', description: 'Day ID' })
  @ApiBody({ type: ReorderActivitiesDto })
  @ApiResponse({
    status: 200,
    description: 'Activities reordered successfully.',
  })
  @Put(':id/days/:dayId/activities/reorder')
  async reorderActivities(
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @CurrentUser() user: JwtPayload,
    @Body() reorderActivitiesDto: ReorderActivitiesDto,
  ) {
    return this.itineraryService.reorderActivities(
      id,
      dayId,
      user.sub,
      reorderActivitiesDto,
    );
  }

  @ApiOperation({ summary: 'Update specific activity details' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated successfully.' })
  @Patch(':id/activities/:activityId')
  async updateActivity(
    @Param('id') id: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.itineraryService.updateActivity(
      id,
      activityId,
      user.sub,
      updateActivityDto,
    );
  }

  @ApiOperation({ summary: 'Add a new activity to a specific day' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiParam({ name: 'dayId', description: 'Day ID' })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Activity added successfully.' })
  @Post(':id/days/:dayId/activities')
  async addActivity(
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @CurrentUser() user: JwtPayload,
    @Body() createActivityDto: CreateActivityDto,
  ) {
    return this.itineraryService.addActivity(
      id,
      dayId,
      user.sub,
      createActivityDto,
    );
  }

  @ApiOperation({ summary: 'Delete activity from a specific day' })
  @ApiParam({ name: 'id', description: 'Itinerary ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully.' })
  @Delete(':id/activities/:activityId')
  @HttpCode(HttpStatus.OK)
  async deleteActivity(
    @Param('id') id: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itineraryService.deleteActivity(id, activityId, user.sub);
  }
}
