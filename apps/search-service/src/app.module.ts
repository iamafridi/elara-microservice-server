import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { TypesenseModule } from './typesense/typesense.module';
import { ProductSearchModule } from './product-search/product-search.module';
import { MerchantSearchModule } from './merchant-search/merchant-search.module';
import { JobSearchModule } from './job-search/job-search.module';
import { GlobalSearchModule } from './global-search/global-search.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'elara',
      entities: ['libs/database/src/entities/**/*.entity.ts'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),

    // Feature modules
    HealthModule,
    TypesenseModule,
    ProductSearchModule,
    MerchantSearchModule,
    JobSearchModule,
    GlobalSearchModule,
  ],
})
export class AppModule {}
