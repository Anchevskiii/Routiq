import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AttractionsService } from './attractions.service';
import { SearchAttractionsDto } from './dto/search-attractions.dto';
import { GetAlternativesDto } from './dto/get-alternatives.dto';
import { FormattedPlace } from './types';

@ApiTags('Attractions')
@ApiBearerAuth()
@Controller('attractions')
@UseGuards(JwtAuthGuard)
export class AttractionsController {
  constructor(private readonly attractionsService: AttractionsService) {}

  @ApiOperation({ summary: 'Search for attractions based on queries/locations' })
  @ApiQuery({ name: 'query', type: String, description: 'Search keywords' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Location' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in meters' })
  @ApiResponse({ status: 200, description: 'Returns matching formatted places.' })
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

  @ApiOperation({ summary: 'Get attraction details by Place ID' })
  @ApiParam({ name: 'id', description: 'Google Place ID' })
  @ApiResponse({ status: 200, description: 'Returns detailed place info.' })
  @ApiResponse({ status: 404, description: 'Place not found.' })
  @Get(':id')
  async getAttractionDetails(@Param('id') id: string): Promise<FormattedPlace> {
    return this.attractionsService.getAttractionDetails(id);
  }

  @ApiOperation({ summary: 'Get alternative attractions' })
  @ApiParam({ name: 'id', description: 'Original Place ID' })
  @ApiBody({ type: GetAlternativesDto })
  @ApiResponse({ status: 200, description: 'Returns a list of alternative places.' })
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
