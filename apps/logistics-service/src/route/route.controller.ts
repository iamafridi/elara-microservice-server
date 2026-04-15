import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RouteService } from './route.service';

@ApiTags('Route')
@ApiBearerAuth()
@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get('rider/:riderId/optimize')
  @ApiOperation({ summary: 'Optimize delivery route for rider' })
  @ApiResponse({ status: 200, description: 'Optimized route' })
  optimizeRoute(@Param('riderId') riderId: string) {
    return this.routeService.optimizeRoute(riderId);
  }

  @Get('order/:orderId/estimate')
  @ApiOperation({ summary: 'Calculate estimated delivery time' })
  @ApiResponse({ status: 200, description: 'Estimated delivery time' })
  calculateDeliveryTime(@Param('orderId') orderId: string) {
    return this.routeService.calculateDeliveryTime(orderId);
  }

  @Get('nearest-rider')
  @ApiOperation({ summary: 'Find nearest available rider' })
  @ApiResponse({ status: 200, description: 'Nearest rider details' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'zoneId', required: false, type: String })
  findNearestRider(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.routeService.findNearestRider(
      parseFloat(latitude),
      parseFloat(longitude),
      zoneId,
    );
  }
}
