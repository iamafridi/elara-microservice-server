import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://Elara.co.uk',
      'https://www.Elara.co.uk',
      'https://api.Elara.co.uk',
      'https://admin.Elara.co.uk',
      'https://merchant.Elara.co.uk',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Elara Payment Service')
    .setDescription('Payment processing, Stripe Connect, wallets, and payouts')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Payments')
    .addTag('Stripe Connect')
    .addTag('Wallets')
    .addTag('Payouts')
    .addTag('Health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Expose Swagger JSON for API Gateway aggregation
  app.use('/api-docs-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PAYMENT_SERVICE_PORT || 3005;
  await app.listen(port);

  console.log(`\n💳 Elara Payment Service`);
  console.log(`────────────────────────────────────────────────────────────`);
  console.log(`🌐 Server running on: http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`────────────────────────────────────────────────────────────\n`);
}

bootstrap();
