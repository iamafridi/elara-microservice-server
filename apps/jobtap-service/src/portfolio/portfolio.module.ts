import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { TaskerPortfolio } from '../../../../libs/database/src/entities/tasker-portfolio.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskerPortfolio, TaskerProfile])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
