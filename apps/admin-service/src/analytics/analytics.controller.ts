import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('users/growth')
  @ApiOperation({ summary: 'Get user growth over time' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'User growth data retrieved successfully' })
  getUserGrowth(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getUserGrowth(numDays);
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'Order stats retrieved successfully' })
  getOrderStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getOrderStats(numDays);
  }

  @Get('revenue/stats')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'Revenue stats retrieved successfully' })
  getRevenueStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getRevenueStats(numDays);
  }

  @Get('merchants/top')
  @ApiOperation({ summary: 'Get top merchants by revenue' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of merchants to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Top merchants retrieved successfully' })
  getTopMerchants(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopMerchants(numLimit);
  }

  @Get('products/top')
  @ApiOperation({ summary: 'Get top products by sales' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Top products retrieved successfully' })
  getTopProducts(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopProducts(numLimit);
  }

  @Get('jobs/stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ status: 200, description: 'Job stats retrieved successfully' })
  getJobStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getJobStats(numDays);
  }
}
