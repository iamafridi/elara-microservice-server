import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ElaraEvent } from './event.interface';

@Injectable()
export class EventPublisher {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async publish<T = any>(
    eventName: string,
    data: T,
    options?: {
      userId?: string;
      correlationId?: string;
    },
  ): Promise<void> {
    const event: ElaraEvent<T> = {
      eventId: uuidv4(),
      eventName,
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'unknown',
      data,
      userId: options?.userId,
      correlationId: options?.correlationId,
    };

    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.publish(eventName, JSON.stringify(event));
        this.logger.debug(`Event published: ${eventName} (${event.eventId})`);
      } else {
        this.logger.warn(`Redis offline (status: ${this.redis?.status}). Event '${eventName}' not dispatched to bus.`);
      }
    } catch (error) {
      this.logger.warn(`Failed to publish event ${eventName} to Redis (continuing):`, error.message);
    }
  }
}
