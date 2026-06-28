import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSearchController } from './product-search.controller';
import { ProductSearchService } from './product-search.service';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Merchant])],
  controllers: [ProductSearchController],
  providers: [ProductSearchService],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
