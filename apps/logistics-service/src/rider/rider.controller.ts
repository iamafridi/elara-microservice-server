import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RiderService } from './rider.service';
import { UpdateRiderStatusDto } from './dto/update-rider-status.dto';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';

@ApiTags('Rider')
@ApiBearerAuth()
@Controller('rider')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get rider details' })
  @ApiResponse({ status: 200, description: 'Rider details' })
  getRider(@Param('id') id: string) {
    return this.riderService.findOne(id);
  }

  @Get('available/list')
  @ApiOperation({ summary: 'Get available riders' })
  @ApiResponse({ status: 200, description: 'Available riders' })
  getAvailableRiders(@Query('zoneId') zoneId?: string) {
    return this.riderService.getAvailableRiders(zoneId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update rider status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRiderStatusDto) {
    return this.riderService.updateStatus(id, dto.status);
  }

  @Put(':id/location')
  @ApiOperation({ summary: 'Update rider location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateRiderLocationDto) {
    return this.riderService.updateLocation(
      id,
      dto.latitude,
      dto.longitude,
      dto.heading,
      dto.speed,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get rider statistics' })
  @ApiResponse({ status: 200, description: 'Rider stats' })
  getRiderStats(@Param('id') id: string) {
    return this.riderService.getRiderStats(id);
  }
}
