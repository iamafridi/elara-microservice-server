import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { RedisModule } from '@app/config';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // HTTP Module for Swagger aggregation
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // Redis for rate limiting
    RedisModule,

    // Throttler for rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute for unauthenticated users
      },
      {
        name: 'authenticated',
        ttl: 60000, // 60 seconds
        limit: 1000, // 1000 requests per minute for authenticated users
      },
    ]),

    // Feature modules
    HealthModule,
    ProxyModule,
  ],
  providers: [
    // Global rate limit guard
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
