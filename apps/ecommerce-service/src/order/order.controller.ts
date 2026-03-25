import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'User orders' })
  findByUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.orderService.findByUser(userId, limit, offset);
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'Get merchant orders' })
  @ApiResponse({ status: 200, description: 'Merchant orders' })
  findByMerchant(
    @Param('merchantId') merchantId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('status') status?: string,
  ) {
    return this.orderService.findByMerchant(merchantId, limit, offset, status);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.orderService.updateStatus(id, status, notes);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  cancelOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.orderService.cancelOrder(id, reason);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Order status history' })
  getHistory(@Param('id') id: string) {
    return this.orderService.getStatusHistory(id);
  }
}
