import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get API Gateway health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // Check if the service itself is responsive
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
      () =>
        this.disk.checkStorage('storage', {
          path: process.platform === 'win32' ? process.cwd().split('\\')[0] + '\\' : '/',
          thresholdPercent: 0.9, // Alert if disk is 90% full
        }),
    ]);
  }

  @Get('services')
  @HealthCheck()
  @ApiOperation({ summary: 'Check health of all downstream microservices' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more services are down' })
  async checkServices() {
    const baseUrl = 'http://localhost';

    return this.health.check([
      () => this.http.pingCheck('auth-service', `${baseUrl}:3001/health`),
      () => this.http.pingCheck('ecommerce-service', `${baseUrl}:3002/health`),
      () => this.http.pingCheck('logistics-service', `${baseUrl}:3003/health`),
      () => this.http.pingCheck('jobtap-service', `${baseUrl}:3004/health`),
      () => this.http.pingCheck('payment-service', `${baseUrl}:3005/health`),
      () => this.http.pingCheck('notification-service', `${baseUrl}:3006/health`),
      () => this.http.pingCheck('media-service', `${baseUrl}:3007/health`),
      () => this.http.pingCheck('search-service', `${baseUrl}:3008/health`),
      () => this.http.pingCheck('website-service', `${baseUrl}:3009/health`),
      () => this.http.pingCheck('admin-service', `${baseUrl}:3010/health`),
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({ status: 200, description: 'Pong' })
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
