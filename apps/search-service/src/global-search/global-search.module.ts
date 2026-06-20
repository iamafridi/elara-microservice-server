import { Module } from '@nestjs/common';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { ProductSearchModule } from '../product-search/product-search.module';
import { MerchantSearchModule } from '../merchant-search/merchant-search.module';
import { JobSearchModule } from '../job-search/job-search.module';

@Module({
  imports: [ProductSearchModule, MerchantSearchModule, JobSearchModule],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
  exports: [GlobalSearchService],
})
export class GlobalSearchModule {}
