import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const user = req['user'] as any;
    return user?.id || req.ip;
  }

  protected async getThrottlerLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    // Authenticated users get higher limit (1000 req/min)
    // Unauthenticated users get lower limit (100 req/min)
    return user ? 1000 : 100;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please try again later.',
        error: 'Rate Limit Exceeded',
        retryAfter: 60, // seconds
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
