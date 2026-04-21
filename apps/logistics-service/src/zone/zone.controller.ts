import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ZoneService } from './zone.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  ConfigureZoneModuleDto,
  AssignRiderToZoneDto,
  CheckLocationDto,
} from './dto/create-zone.dto';

@ApiTags('Delivery Zones')
@ApiBearerAuth()
@Controller('zones')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a delivery zone',
    description: 'Create a new delivery zone with polygon geofencing'
  })
  @ApiResponse({ status: 201, description: 'Zone created' })
  createZone(@Body() dto: CreateZoneDto) {
    return this.zoneService.createZone(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all delivery zones' })
  @ApiResponse({ status: 200, description: 'List of zones' })
  getAllZones(@Query('status') status?: 'active' | 'inactive') {
    return this.zoneService.getAllZones(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by ID' })
  @ApiResponse({ status: 200, description: 'Zone details' })
  findOne(@Param('id') id: string) {
    return this.zoneService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update delivery zone' })
  @ApiResponse({ status: 200, description: 'Zone updated' })
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zoneService.updateZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete delivery zone' })
  @ApiResponse({ status: 200, description: 'Zone deleted' })
  deleteZone(@Param('id') id: string) {
    return this.zoneService.deleteZone(id);
  }

  @Post('configure-module')
  @ApiOperation({
    summary: 'Configure zone module',
    description: 'Set delivery fees and commission for a specific module in a zone'
  })
  @ApiResponse({ status: 200, description: 'Zone module configured' })
  configureZoneModule(@Body() dto: ConfigureZoneModuleDto) {
    return this.zoneService.configureZoneModule(dto);
  }

  @Post('assign-rider')
  @ApiOperation({
    summary: 'Assign rider to zone',
    description: 'Assign a delivery rider to operate in a specific zone'
  })
  @ApiResponse({ status: 200, description: 'Rider assigned to zone' })
  assignRiderToZone(@Body() dto: AssignRiderToZoneDto) {
    return this.zoneService.assignRiderToZone(dto);
  }

  @Delete(':zoneId/riders/:riderId')
  @ApiOperation({ summary: 'Remove rider from zone' })
  @ApiResponse({ status: 200, description: 'Rider removed from zone' })
  removeRiderFromZone(
    @Param('zoneId') zoneId: string,
    @Param('riderId') riderId: string,
  ) {
    return this.zoneService.removeRiderFromZone(riderId, zoneId);
  }

  @Get(':id/riders')
  @ApiOperation({ summary: 'Get riders in a zone' })
  @ApiResponse({ status: 200, description: 'List of riders in zone' })
  getRidersInZone(@Param('id') id: string) {
    return this.zoneService.getRidersInZone(id);
  }

  @Get('rider/:riderId/zones')
  @ApiOperation({ summary: 'Get zones for a rider' })
  @ApiResponse({ status: 200, description: 'List of zones assigned to rider' })
  getRiderZones(@Param('riderId') riderId: string) {
    return this.zoneService.getRiderZones(riderId);
  }

  @Post('check-location')
  @ApiOperation({
    summary: 'Check if location is in delivery zone',
    description: 'Verify if a coordinate is within any active delivery zone'
  })
  @ApiResponse({ status: 200, description: 'Location check result' })
  checkLocation(@Body() dto: CheckLocationDto) {
    return this.zoneService.checkLocation(dto);
  }

  @Get('delivery-fee/:latitude/:longitude/:moduleType')
  @ApiOperation({
    summary: 'Get delivery fee for location',
    description: 'Calculate delivery fee based on location and module type'
  })
  @ApiResponse({ status: 200, description: 'Delivery fee details' })
  getDeliveryFee(
    @Param('latitude') latitude: string,
    @Param('longitude') longitude: string,
    @Param('moduleType') moduleType: string,
  ) {
    return this.zoneService.getDeliveryFee(
      parseFloat(latitude),
      parseFloat(longitude),
      moduleType,
    );
  }
}
