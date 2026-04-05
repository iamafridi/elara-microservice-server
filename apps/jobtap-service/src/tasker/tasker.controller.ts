import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaskerService } from './tasker.service';

@ApiTags('Taskers')
@ApiBearerAuth()
@Controller('taskers')
export class TaskerController {
  constructor(private readonly taskerService: TaskerService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get tasker profile' })
  @ApiResponse({ status: 200, description: 'Tasker profile' })
  getTasker(@Param('id') id: string) {
    return this.taskerService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get tasker by user ID' })
  @ApiResponse({ status: 200, description: 'Tasker profile' })
  getByUserId(@Param('userId') userId: string) {
    return this.taskerService.findByUserId(userId);
  }

  @Get('search/nearby')
  @ApiOperation({ summary: 'Search nearby taskers' })
  @ApiResponse({ status: 200, description: 'Nearby taskers' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'skills', required: false, type: [String] })
  @ApiQuery({ name: 'radiusMiles', required: false, type: Number })
  searchNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('skills') skills?: string[],
    @Query('radiusMiles') radiusMiles?: string,
  ) {
    return this.taskerService.searchNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      skills,
      radiusMiles ? parseFloat(radiusMiles) : undefined,
    );
  }
}
