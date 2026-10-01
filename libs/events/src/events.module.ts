import { Module, Global, DynamicModule } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { EventPublisher } from './event-publisher.service';

@Global()
@Module({})
export class EventsModule {
  static forRoot(): DynamicModule {
    return {
      module: EventsModule,
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: (configService: ConfigService) => {
            const redis = new Redis({
              host: configService.get('redis.host'),
              port: configService.get('redis.port'),
              password: configService.get('redis.password'),
            });

            redis.on('connect', () => {
              console.log('Redis connected successfully');
            });

            redis.on('error', (error) => {
              console.error('Redis connection error:', error);
            });

            return redis;
          },
          inject: [ConfigService],
        },
        EventPublisher,
      ],
      exports: ['REDIS_CLIENT', EventPublisher],
    };
  }
}
