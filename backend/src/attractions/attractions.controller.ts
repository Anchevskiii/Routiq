import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AttractionsService } from './attractions.service';
import { SearchAttractionsDto } from './dto/search-attractions.dto';
import { GetAlternativesDto } from './dto/get-alternatives.dto';
import { FormattedPlace } from './types';

@Controller('attractions')
@UseGuards(JwtAuthGuard)
export class AttractionsController {
  constructor(private readonly attractionsService: AttractionsService) {}

  @Get('search')
  async searchAttractions(
    @Query() searchDto: SearchAttractionsDto,
  ): Promise<FormattedPlace[]> {
    return this.attractionsService.searchAttractions(
      searchDto.query,
      searchDto.location,
      searchDto.radius,
    );
  }

  @Get(':id')
  async getAttractionDetails(@Param('id') id: string): Promise<FormattedPlace> {
    return this.attractionsService.getAttractionDetails(id);
  }

  @Post(':id/alternatives')
  async getAlternatives(
    @Param('id') id: string,
    @Body() getAlternativesDto: GetAlternativesDto,
  ): Promise<FormattedPlace[]> {
    return this.attractionsService.getAlternatives(
      id,
      getAlternativesDto.destination,
    );
  }
}
