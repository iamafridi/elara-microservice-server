import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobStatus } from '../../../../libs/database/src/entities/job.entity';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created' })
  createJob(@Body() dto: CreateJobDto) {
    return this.jobService.createJob(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job details' })
  getJob(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get jobs by customer' })
  @ApiResponse({ status: 200, description: 'Customer jobs' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  getCustomerJobs(
    @Param('customerId') customerId: string,
    @Query('status') status?: JobStatus,
  ) {
    return this.jobService.getCustomerJobs(customerId, status);
  }

  @Get('search/nearby')
  @ApiOperation({ summary: 'Search nearby jobs' })
  @ApiResponse({ status: 200, description: 'Nearby jobs' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'radiusMiles', required: false, type: Number })
  searchNearbyJobs(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('categoryId') categoryId?: string,
    @Query('radiusMiles') radiusMiles?: string,
  ) {
    return this.jobService.searchNearbyJobs(
      parseFloat(latitude),
      parseFloat(longitude),
      categoryId,
      radiusMiles ? parseFloat(radiusMiles) : undefined,
    );
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update job status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateJobStatusDto) {
    return this.jobService.updateStatus(id, dto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel job' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  cancelJob(@Param('id') id: string, @Query('customerId') customerId: string) {
    return this.jobService.cancelJob(id, customerId);
  }
}
