import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OpenAPIObject } from '@nestjs/swagger';

export interface MicroserviceConfig {
  name: string;
  url: string;
  port: number;
  prefix: string;
  description: string;
}

@Injectable()
export class SwaggerAggregatorService {
  private readonly logger = new Logger(SwaggerAggregatorService.name);
  private microservices: MicroserviceConfig[] = [];

  constructor(private readonly httpService: HttpService) {
    this.initializeMicroservices();
  }

  private initializeMicroservices() {
    const baseUrl = process.env.SERVICES_BASE_URL || 'http://localhost';

    this.microservices = [
      {
        name: 'auth-service',
        url: `${baseUrl}:${process.env.AUTH_SERVICE_PORT || 3001}`,
        port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
        prefix: '/auth',
        description: 'Authentication and user management',
      },
      {
        name: 'ecommerce-service',
        url: `${baseUrl}:${process.env.ECOMMERCE_SERVICE_PORT || 3002}`,
        port: parseInt(process.env.ECOMMERCE_SERVICE_PORT || '3002'),
        prefix: '/ecommerce',
        description: 'Products, cart, and orders',
      },
      {
        name: 'logistics-service',
        url: `${baseUrl}:${process.env.LOGISTICS_SERVICE_PORT || 3003}`,
        port: parseInt(process.env.LOGISTICS_SERVICE_PORT || '3003'),
        prefix: '/logistics',
        description: 'Riders, dispatch, and tracking',
      },
      {
        name: 'jobtap-service',
        url: `${baseUrl}:${process.env.JOBTAP_SERVICE_PORT || 3004}`,
        port: parseInt(process.env.JOBTAP_SERVICE_PORT || '3004'),
        prefix: '/jobtap',
        description: 'Jobs, taskers, and assignments',
      },
      {
        name: 'payment-service',
        url: `${baseUrl}:${process.env.PAYMENT_SERVICE_PORT || 3005}`,
        port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3005'),
        prefix: '/payment',
        description: 'Payments, wallets, and payouts',
      },
      {
        name: 'notification-service',
        url: `${baseUrl}:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`,
        port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3006'),
        prefix: '/notifications',
        description: 'Push, email, and SMS notifications',
      },
      {
        name: 'media-service',
        url: `${baseUrl}:${process.env.MEDIA_SERVICE_PORT || 3007}`,
        port: parseInt(process.env.MEDIA_SERVICE_PORT || '3007'),
        prefix: '/media',
        description: 'File uploads and media processing',
      },
      {
        name: 'search-service',
        url: `${baseUrl}:${process.env.SEARCH_SERVICE_PORT || 3008}`,
        port: parseInt(process.env.SEARCH_SERVICE_PORT || '3008'),
        prefix: '/search',
        description: 'Search and discovery',
      },
      {
        name: 'website-service',
        url: `${baseUrl}:${process.env.WEBSITE_SERVICE_PORT || 3009}`,
        port: parseInt(process.env.WEBSITE_SERVICE_PORT || '3009'),
        prefix: '/website',
        description: 'Landing pages and blog',
      },
      {
        name: 'admin-service',
        url: `${baseUrl}:${process.env.ADMIN_SERVICE_PORT || 3010}`,
        port: parseInt(process.env.ADMIN_SERVICE_PORT || '3010'),
        prefix: '/admin',
        description: 'Admin panel operations',
      },
    ];

    this.logger.log(
      `Initialized ${this.microservices.length} microservices for Swagger aggregation`,
    );
  }

  /**
   * Fetch Swagger JSON from a microservice
   */
  private async fetchServiceSwagger(
    service: MicroserviceConfig,
  ): Promise<OpenAPIObject | null> {
    try {
      const swaggerUrl = `${service.url}/api-docs-json`;
      this.logger.debug(`Fetching Swagger from ${swaggerUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(swaggerUrl, {
          timeout: 5000,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch Swagger from ${service.name}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Aggregate all microservice Swagger documents into one
   */
  async aggregateSwaggerDocs(
    baseDocument: OpenAPIObject,
  ): Promise<OpenAPIObject> {
    this.logger.log('Starting Swagger aggregation...');

    const aggregatedPaths: Record<string, any> = { ...baseDocument.paths };
    const aggregatedTags: Array<{ name: string; description?: string }> = [
      ...(baseDocument.tags || []),
    ];
    const aggregatedSchemas: Record<string, any> = {
      ...(baseDocument.components?.schemas || {}),
    };

    // Fetch Swagger from all microservices in parallel
    const swaggerPromises = this.microservices.map((service) =>
      this.fetchServiceSwagger(service).then((doc) => ({ service, doc })),
    );

    const results = await Promise.all(swaggerPromises);

    // Process each microservice's Swagger document
    for (const { service, doc } of results) {
      if (!doc) {
        this.logger.warn(`Skipping ${service.name} - no Swagger document`);
        continue;
      }

      // Add service tag
      aggregatedTags.push({
        name: service.name,
        description: service.description,
      });

      // Merge paths with service prefix
      if (doc.paths) {
        Object.entries(doc.paths).forEach(([path, pathItem]) => {
          // Prefix the path with service prefix
          const prefixedPath = `${service.prefix}${path}`;

          // Add service tag to all operations
          const updatedPathItem = this.addServiceTagToOperations(
            pathItem,
            service.name,
          );

          aggregatedPaths[prefixedPath] = updatedPathItem;
        });
      }

      // Merge schemas
      if (doc.components?.schemas) {
        Object.entries(doc.components.schemas).forEach(([name, schema]) => {
          // Prefix schema name with service name to avoid conflicts
          const prefixedName = `${service.name}_${name}`;
          aggregatedSchemas[prefixedName] = schema;
        });
      }

      this.logger.log(`✅ Merged Swagger from ${service.name}`);
    }

    // Build the aggregated document
    const aggregatedDoc: OpenAPIObject = {
      ...baseDocument,
      paths: aggregatedPaths,
      tags: aggregatedTags,
      components: {
        ...baseDocument.components,
        schemas: aggregatedSchemas,
      },
    };

    this.logger.log(
      `✅ Swagger aggregation complete: ${Object.keys(aggregatedPaths).length} endpoints`,
    );

    return aggregatedDoc;
  }

  /**
   * Add service tag to all operations in a path item
   */
  private addServiceTagToOperations(pathItem: any, serviceTag: string): any {
    const operations = ['get', 'post', 'put', 'patch', 'delete', 'options'];
    const updatedPathItem = { ...pathItem };

    operations.forEach((method) => {
      if (updatedPathItem[method]) {
        const operation = updatedPathItem[method];
        updatedPathItem[method] = {
          ...operation,
          tags: [...(operation.tags || []), serviceTag],
        };
      }
    });

    return updatedPathItem;
  }
}
