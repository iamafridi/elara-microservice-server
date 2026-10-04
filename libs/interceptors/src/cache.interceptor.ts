import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Redis } from 'ioredis';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `cache:${url}`;

    try {
      const cachedData = await this.redis.get(cacheKey);

      if (cachedData) {
        return of(JSON.parse(cachedData));
      }

      return next.handle().pipe(
        tap(async (data) => {
          await this.redis.setex(cacheKey, 300, JSON.stringify(data)); // Cache for 5 minutes
        }),
      );
    } catch (error) {
      return next.handle();
    }
  }
}
