import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { PageModule } from './page/page.module';
import { BlogModule } from './blog/blog.module';
import { FaqModule } from './faq/faq.module';
import { DatabaseConfigService } from '../../../libs/config/src/database-config.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Feature modules
    HealthModule,
    PageModule,
    BlogModule,
    FaqModule,
  ],
})
export class AppModule {}
