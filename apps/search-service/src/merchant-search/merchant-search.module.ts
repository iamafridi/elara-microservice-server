import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantSearchController } from './merchant-search.controller';
import { MerchantSearchService } from './merchant-search.service';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant])],
  controllers: [MerchantSearchController],
  providers: [MerchantSearchService],
  exports: [MerchantSearchService],
})
export class MerchantSearchModule {}
