import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageController } from './page.controller';
import { PageService } from './page.service';
import { LandingPage } from '../../../../libs/database/src/entities/landing-page.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandingPage])],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
