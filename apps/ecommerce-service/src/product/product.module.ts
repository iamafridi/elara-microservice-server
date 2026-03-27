import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { ProductVariant } from '../../../../libs/database/src/entities/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
