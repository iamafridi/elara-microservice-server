import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { AssignRiderDto } from './dto/assign-rider.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post(':orderId/assign')
  @ApiOperation({ summary: 'Assign rider to order' })
  @ApiResponse({ status: 200, description: 'Rider assigned' })
  assignRider(@Param('orderId') orderId: string, @Body() dto: AssignRiderDto) {
    return this.deliveryService.assignRider(orderId, dto);
  }

  @Put(':orderId/status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('orderId') orderId: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateDeliveryStatus(orderId, dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get delivery details' })
  @ApiResponse({ status: 200, description: 'Delivery details' })
  getDeliveryDetails(@Param('orderId') orderId: string) {
    return this.deliveryService.getDeliveryDetails(orderId);
  }

  @Get('rider/:riderId/active')
  @ApiOperation({ summary: 'Get rider active deliveries' })
  @ApiResponse({ status: 200, description: 'Active deliveries' })
  getRiderActiveDeliveries(@Param('riderId') riderId: string) {
    return this.deliveryService.getRiderActiveDeliveries(riderId);
  }

  @Get('pending/list')
  @ApiOperation({ summary: 'Get pending deliveries' })
  @ApiResponse({ status: 200, description: 'Pending deliveries' })
  getPendingDeliveries(@Query('zoneId') zoneId?: string) {
    return this.deliveryService.getPendingDeliveries(zoneId);
  }
}
