import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
        });

        let errorLogged = false;
        let isConnected = false;

        redis.on('connect', () => {
          console.log('✅ Redis connected');
          isConnected = true;
          errorLogged = false; // Reset error flag on successful connection
        });

        redis.on('ready', () => {
          isConnected = true;
        });

        redis.on('error', (err) => {
          // Only log error if we haven't successfully connected yet
          if (!isConnected && !errorLogged) {
            console.warn('⚠️  Redis connection failed. Redis features will be unavailable.');
            console.warn('   To enable Redis, start Docker Desktop and run: docker compose up -d redis');
            errorLogged = true;
          }
        });

        // Attempt to connect, but don't fail if it doesn't
        redis.connect().catch(() => {
          // Connection failed, but we'll continue without Redis
        });

        return redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
