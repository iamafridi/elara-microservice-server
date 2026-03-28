import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { JobModule } from './job/job.module';
import { QuoteModule } from './quote/quote.module';
import { AssignmentModule } from './assignment/assignment.module';
import { TaskerModule } from './tasker/tasker.module';
import { CategoryModule } from './category/category.module';
import { PortfolioModule } from './portfolio/portfolio.module';
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
    JobModule,
    QuoteModule,
    AssignmentModule,
    TaskerModule,
    CategoryModule,
    PortfolioModule,
  ],
})
export class AppModule {}
