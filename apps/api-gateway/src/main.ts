import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { LoggingInterceptor } from '@app/interceptors';
import { SwaggerAggregatorService } from './swagger/swagger-aggregator.service';
import { HttpService } from '@nestjs/axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sentry initialization
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3020',
      'http://localhost:5173', // Vite dev server
      'https://elara.com.bd',
      'https://www.elara.com.bd',
      'https://admin.elara.com.bd',
      /\.elara\.com\.bd$/,
    ],

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation - Base configuration
  const config = new DocumentBuilder()
    .setTitle('Elara API Gateway')
    .setDescription('Elara Bangladesh Super App - Unified API Documentation for all microservices')
    .setVersion('2.0')
    .addBearerAuth()

    .addTag('Health', 'Health check endpoints')
    .addTag('auth-service', 'Authentication and user management')
    .addTag('ecommerce-service', 'Products, cart, and orders')
    .addTag('logistics-service', 'Riders, dispatch, and tracking')
    .addTag('jobtap-service', 'Jobs, taskers, and assignments')
    .addTag('payment-service', 'Payments, wallets, and payouts')
    .addTag('notification-service', 'Push, email, and SMS notifications')
    .addTag('media-service', 'File uploads and media processing')
    .addTag('search-service', 'Search and discovery')
    .addTag('website-service', 'Landing pages and blog')
    .addTag('admin-service', 'Admin panel operations')
    .build();

  // Create base document with gateway's own endpoints
  const baseDocument = SwaggerModule.createDocument(app, config);

  // Initialize Swagger aggregator service
  const httpService = app.get(HttpService);
  const swaggerAggregator = new SwaggerAggregatorService(httpService);

  // Aggregate all microservice Swagger docs (async)
  const aggregatedDocument = await swaggerAggregator.aggregateSwaggerDocs(
    baseDocument,
  );

  // Setup Swagger UI with aggregated documentation
  SwaggerModule.setup('api-docs', app, aggregatedDocument);

  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('🚀 Elara API Gateway');
  console.log('─'.repeat(60));
  console.log(`🌐 Server running on: http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/v1/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('─'.repeat(60));
  console.log('');
}

bootstrap();
