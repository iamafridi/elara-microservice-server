import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface ServiceConfig {
  name: string;
  url: string;
  port: number;
  routes: string[];
  prefix?: string; // Optional service-specific prefix (e.g., 'api' for notification service)
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly services: Map<string, ServiceConfig> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeServices();
  }

  private initializeServices() {
    const baseUrl = process.env.SERVICES_BASE_URL || 'http://localhost';

    const servicesConfig: ServiceConfig[] = [
      {
        name: 'auth-service',
        url: `${baseUrl}:${process.env.AUTH_SERVICE_PORT || 3001}`,
        port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
        routes: ['/auth', '/users'],
      },
      {
        name: 'ecommerce-service',
        url: `${baseUrl}:${process.env.ECOMMERCE_SERVICE_PORT || 3002}`,
        port: parseInt(process.env.ECOMMERCE_SERVICE_PORT || '3002'),
        routes: ['/merchants', '/products', '/categories', '/cart', '/orders'],
      },
      {
        name: 'logistics-service',
        url: `${baseUrl}:${process.env.LOGISTICS_SERVICE_PORT || 3003}`,
        port: parseInt(process.env.LOGISTICS_SERVICE_PORT || '3003'),
        routes: ['/riders', '/dispatch', '/tracking', '/zones'],
      },
      {
        name: 'jobtap-service',
        url: `${baseUrl}:${process.env.JOBTAP_SERVICE_PORT || 3004}`,
        port: parseInt(process.env.JOBTAP_SERVICE_PORT || '3004'),
        routes: ['/jobs', '/taskers', '/quotes', '/assignments'],
      },
      {
        name: 'payment-service',
        url: `${baseUrl}:${process.env.PAYMENT_SERVICE_PORT || 3005}`,
        port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3005'),
        routes: ['/payments', '/wallet', '/payouts', '/refunds', '/transactions'],
      },
      {
        name: 'notification-service',
        url: `${baseUrl}:${process.env.NOTIFICATION_SERVICE_PORT || 3011}`,
        port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3011'),
        routes: ['/notifications', '/push', '/email', '/sms', '/support'],
        prefix: '/api', // Notification service uses 'api' global prefix
      },
      {
        name: 'media-service',
        url: `${baseUrl}:${process.env.MEDIA_SERVICE_PORT || 3007}`,
        port: parseInt(process.env.MEDIA_SERVICE_PORT || '3007'),
        routes: ['/media', '/upload', '/images', '/videos'],
      },
      {
        name: 'search-service',
        url: `${baseUrl}:${process.env.SEARCH_SERVICE_PORT || 3008}`,
        port: parseInt(process.env.SEARCH_SERVICE_PORT || '3008'),
        routes: ['/search'],
      },
      {
        name: 'website-service',
        url: `${baseUrl}:${process.env.WEBSITE_SERVICE_PORT || 3009}`,
        port: parseInt(process.env.WEBSITE_SERVICE_PORT || '3009'),
        routes: ['/pages', '/blog', '/seo', '/faqs'],
      },
      {
        name: 'admin-service',
        url: `${baseUrl}:${process.env.ADMIN_SERVICE_PORT || 3010}`,
        port: parseInt(process.env.ADMIN_SERVICE_PORT || '3010'),
        routes: ['/admin', '/analytics', '/settings', '/admin-users'],
      },
    ];

    servicesConfig.forEach((service) => {
      this.services.set(service.name, service);
    });

    this.logger.log(`✅ Initialized ${this.services.size} microservices`);
  }

  getTargetService(path: string): ServiceConfig | null {
    for (const [, service] of this.services) {
      for (const route of service.routes) {
        if (path.startsWith(route)) {
          return service;
        }
      }
    }
    return null;
  }

  async forwardRequest(
    method: string,
    path: string,
    body?: any,
    headers?: any,
    query?: any,
  ): Promise<AxiosResponse> {
    // Strip global prefix if present
    const normalizedPath = path.startsWith('/v1') ? path.slice(3) : path;

    const service = this.getTargetService(normalizedPath);

    if (!service) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: `No service found for route: ${path}`,
          error: 'Service Not Found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Build target URL with service-specific prefix if provided
    const servicePrefix = service.prefix || '';
    const targetUrl = `${service.url}${servicePrefix}${normalizedPath}`;

    // Remove gateway-specific headers
    const forwardHeaders = { ...headers };
    delete forwardHeaders.host;
    delete forwardHeaders['content-length'];

    try {
      this.logger.debug(
        `Forwarding ${method} ${normalizedPath} → ${service.name} (${targetUrl})`,
      );

      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: targetUrl,
          data: body,
          headers: forwardHeaders,
          params: query,
          validateStatus: () => true, // Don't throw on non-2xx status
        }),
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error forwarding to ${service.name}: ${error.message}`,
        error.stack,
      );

      // Service unavailable
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: `${service.name} is currently unavailable`,
          error: 'Service Unavailable',
          service: service.name,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
}
