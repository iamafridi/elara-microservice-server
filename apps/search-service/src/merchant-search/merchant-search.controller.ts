import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MerchantSearchService, MerchantSearchParams } from './merchant-search.service';

@ApiTags('Merchant Search')
@Controller('search/merchants')
export class MerchantSearchController {
  constructor(private readonly merchantSearchService: MerchantSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search merchants' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  @ApiQuery({ name: 'openNow', required: false, type: Boolean })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['rating', 'distance', 'name'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  searchMerchants(
    @Query('query') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('openNow') openNow?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy?: 'rating' | 'distance' | 'name',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const params: MerchantSearchParams = {
      query,
      categoryId,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      openNow: openNow === 'true',
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.merchantSearchService.searchMerchants(params);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Merchant autocomplete' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  autocomplete(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantSearchService.autocomplete(query, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top-rated merchants' })
  @ApiResponse({ status: 200, description: 'Top-rated merchants' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopRated(@Query('limit') limit?: string) {
    return this.merchantSearchService.getTopRated(limit ? parseInt(limit, 10) : undefined);
  }
}
