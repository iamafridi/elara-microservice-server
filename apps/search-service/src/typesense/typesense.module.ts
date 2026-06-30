import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypesenseService } from './typesense.service';
import { IndexingService } from './indexing.service';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Product, Merchant, Job]),
  ],
  providers: [TypesenseService, IndexingService],
  exports: [TypesenseService, IndexingService],
})
export class TypesenseModule {}
