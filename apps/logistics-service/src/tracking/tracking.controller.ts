import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Track order in real-time' })
  @ApiResponse({ status: 200, description: 'Order tracking details' })
  trackOrder(@Param('orderId') orderId: string) {
    return this.trackingService.trackOrder(orderId);
  }

  @Get('rider/:riderId/location')
  @ApiOperation({ summary: 'Get rider current location' })
  @ApiResponse({ status: 200, description: 'Rider location' })
  getRiderLocation(@Param('riderId') riderId: string) {
    return this.trackingService.getRiderLocation(riderId);
  }

  @Get('order/:orderId/route')
  @ApiOperation({ summary: 'Get delivery route' })
  @ApiResponse({ status: 200, description: 'Delivery route with waypoints' })
  getDeliveryRoute(@Param('orderId') orderId: string) {
    return this.trackingService.getDeliveryRoute(orderId);
  }

  @Get('order/:orderId/route/enhanced')
  @ApiOperation({
    summary: 'Get enhanced delivery route with Mapbox',
    description: 'Get turn-by-turn directions with traffic data',
  })
  @ApiResponse({ status: 200, description: 'Enhanced route with geometry and steps' })
  getEnhancedDeliveryRoute(@Param('orderId') orderId: string) {
    return this.trackingService.getEnhancedDeliveryRoute(orderId);
  }

  @Put('rider/:riderId/location')
  @ApiOperation({
    summary: 'Update rider location',
    description: 'Rider app calls this to update location in real-time',
  })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  updateRiderLocation(@Param('riderId') riderId: string, @Body() dto: UpdateLocationDto) {
    return this.trackingService.updateRiderLocation(
      riderId,
      dto.latitude,
      dto.longitude,
      dto.heading,
      dto.speed,
    );
  }

  @Get('rider/:riderId/location/history')
  @ApiOperation({ summary: 'Get rider location history' })
  @ApiResponse({ status: 200, description: 'Rider location history' })
  getRiderLocationHistory(
    @Param('riderId') riderId: string,
    @Query('limit') limit?: number,
  ) {
    return this.trackingService.getRiderLocationHistory(riderId, limit || 50);
  }

  @Get('deliveries/active')
  @ApiOperation({
    summary: 'Get all active deliveries',
    description: 'Get real-time tracking for all active orders',
  })
  @ApiResponse({ status: 200, description: 'Active deliveries with live tracking' })
  getActiveDeliveries(@Query('riderIds') riderIds?: string) {
    const riderIdArray = riderIds ? riderIds.split(',') : undefined;
    return this.trackingService.getActiveDeliveries(riderIdArray);
  }
}
