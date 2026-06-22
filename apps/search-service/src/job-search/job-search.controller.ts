import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JobSearchService, JobSearchParams } from './job-search.service';

@ApiTags('Job Search')
@Controller('search/jobs')
export class JobSearchController {
  constructor(private readonly jobSearchService: JobSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search jobs' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'radiusMiles', required: false, type: Number })
  @ApiQuery({ name: 'minBudget', required: false, type: Number })
  @ApiQuery({ name: 'maxBudget', required: false, type: Number })
  @ApiQuery({ name: 'budgetType', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['budget', 'date', 'distance'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  searchJobs(
    @Query('query') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusMiles') radiusMiles?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('budgetType') budgetType?: string,
    @Query('sortBy') sortBy?: 'budget' | 'date' | 'distance',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const params: JobSearchParams = {
      query,
      categoryId,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusMiles: radiusMiles ? parseFloat(radiusMiles) : undefined,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      budgetType,
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.jobSearchService.searchJobs(params);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Job autocomplete' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  autocomplete(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobSearchService.autocomplete(query, limit ? parseInt(limit, 10) : undefined);
  }
}
