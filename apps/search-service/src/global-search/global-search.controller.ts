import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GlobalSearchService, GlobalSearchParams } from './global-search.service';

@ApiTags('Global Search')
@Controller('search')
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across all types' })
  @ApiResponse({ status: 200, description: 'Search results from all categories' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'types', required: false, type: [String], description: 'Comma-separated list: products,merchants,jobs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @Query('query') query: string,
    @Query('types') types?: string,
    @Query('limit') limit?: string,
  ) {
    const params: GlobalSearchParams = {
      query,
      types: types ? types.split(',') as any : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    return this.globalSearchService.search(params);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Global autocomplete' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions from all categories' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  autocomplete(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.globalSearchService.autocomplete(query, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending items' })
  @ApiResponse({ status: 200, description: 'Trending products and merchants' })
  getTrending() {
    return this.globalSearchService.getTrending();
  }
}
