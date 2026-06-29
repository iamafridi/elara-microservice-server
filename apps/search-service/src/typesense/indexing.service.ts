import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypesenseService } from './typesense.service';
import {
  productsSchema,
  merchantsSchema,
  jobsSchema,
  PRODUCTS_COLLECTION,
  MERCHANTS_COLLECTION,
  JOBS_COLLECTION,
} from './schemas';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';

@Injectable()
export class IndexingService implements OnModuleInit {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private typesenseService: TypesenseService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async onModuleInit() {
    await this.initializeCollections();
  }

  /**
   * Initialize Typesense collections
   */
  private async initializeCollections() {
    this.logger.log('Initializing Typesense collections...');

    try {
      await this.typesenseService.createOrUpdateCollection(PRODUCTS_COLLECTION, productsSchema);
      await this.typesenseService.createOrUpdateCollection(MERCHANTS_COLLECTION, merchantsSchema);
      await this.typesenseService.createOrUpdateCollection(JOBS_COLLECTION, jobsSchema);

      this.logger.log('Typesense collections initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Typesense collections', error.message);
    }
  }

  /**
   * Index a product
   */
  async indexProduct(product: Product) {
    const document = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      merchantId: product.merchantId,
      merchantName: product.merchant?.storeName || '',
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      images: product.images || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      inStock: product.stockEnabled ? product.stockCount > 0 : true,
      stockCount: product.stockCount || 0,
      createdAt: Math.floor(new Date(product.createdAt).getTime() / 1000),
    };

    return await this.typesenseService.indexDocument(PRODUCTS_COLLECTION, document);
  }

  /**
   * Index a merchant
   */
  async indexMerchant(merchant: Merchant) {
    const document = {
      id: merchant.id,
      storeName: merchant.storeName,
      description: merchant.description || '',
      categoryId: merchant.categoryId,
      categoryName: merchant.category?.name || '',
      address: merchant.address || '',
      city: merchant.city || '',
      postcode: merchant.postcode || '',
      location: merchant.latitude && merchant.longitude
        ? [merchant.latitude, merchant.longitude]
        : [0, 0],
      rating: merchant.rating || 0,
      totalReviews: merchant.totalReviews || 0,
      prepTimeMinutes: merchant.prepTimeMinutes || 30,
      deliveryRadiusKm: merchant.deliveryRadiusKm || 5,
      isOpen: merchant.openStatus === 'open',
      isActive: merchant.status === 'active',
      logo: merchant.logo || '',
      coverImage: merchant.coverImage || '',
      createdAt: Math.floor(new Date(merchant.createdAt).getTime() / 1000),
    };

    return await this.typesenseService.indexDocument(MERCHANTS_COLLECTION, document);
  }

  /**
   * Index a job
   */
  async indexJob(job: Job) {
    const document = {
      id: job.id,
      title: job.title,
      description: job.description || '',
      categoryId: job.categoryId,
      categoryName: job.category?.name || '',
      subcategoryId: job.subcategoryId || '',
      customerId: job.customerId,
      customerName: job.customer?.name || '',
      location: job.latitude && job.longitude
        ? [job.latitude, job.longitude]
        : [0, 0],
      address: job.address || '',
      city: job.city || '',
      postcode: job.postcode || '',
      budgetType: job.budgetType,
      budgetAmount: job.budgetAmount || 0,
      status: job.status,
      preferredStartDate: job.preferredStartDate
        ? Math.floor(new Date(job.preferredStartDate).getTime() / 1000)
        : undefined,
      photos: job.photos || [],
      videos: job.videos || [],
      createdAt: Math.floor(new Date(job.createdAt).getTime() / 1000),
    };

    return await this.typesenseService.indexDocument(JOBS_COLLECTION, document);
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(limit: number = 1000, offset: number = 0) {
    const products = await this.productRepository.find({
      relations: ['merchant', 'category'],
      take: limit,
      skip: offset,
    });

    const documents = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      merchantId: product.merchantId,
      merchantName: product.merchant?.storeName || '',
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      images: product.images || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      inStock: product.stockEnabled ? product.stockCount > 0 : true,
      stockCount: product.stockCount || 0,
      createdAt: Math.floor(new Date(product.createdAt).getTime() / 1000),
    }));

    if (documents.length > 0) {
      await this.typesenseService.indexDocuments(PRODUCTS_COLLECTION, documents);
      this.logger.log(`Bulk indexed ${documents.length} products`);
    }

    return { indexed: documents.length, hasMore: products.length === limit };
  }

  /**
   * Bulk index merchants
   */
  async bulkIndexMerchants(limit: number = 1000, offset: number = 0) {
    const merchants = await this.merchantRepository.find({
      relations: ['category'],
      take: limit,
      skip: offset,
    });

    const documents = merchants.map(merchant => ({
      id: merchant.id,
      storeName: merchant.storeName,
      description: merchant.description || '',
      categoryId: merchant.categoryId,
      categoryName: merchant.category?.name || '',
      address: merchant.address || '',
      city: merchant.city || '',
      postcode: merchant.postcode || '',
      location: merchant.latitude && merchant.longitude
        ? [merchant.latitude, merchant.longitude]
        : [0, 0],
      rating: merchant.rating || 0,
      totalReviews: merchant.totalReviews || 0,
      prepTimeMinutes: merchant.prepTimeMinutes || 30,
      deliveryRadiusKm: merchant.deliveryRadiusKm || 5,
      isOpen: merchant.openStatus === 'open',
      isActive: merchant.status === 'active',
      logo: merchant.logo || '',
      coverImage: merchant.coverImage || '',
      createdAt: Math.floor(new Date(merchant.createdAt).getTime() / 1000),
    }));

    if (documents.length > 0) {
      await this.typesenseService.indexDocuments(MERCHANTS_COLLECTION, documents);
      this.logger.log(`Bulk indexed ${documents.length} merchants`);
    }

    return { indexed: documents.length, hasMore: merchants.length === limit };
  }

  /**
   * Bulk index jobs
   */
  async bulkIndexJobs(limit: number = 1000, offset: number = 0) {
    const jobs = await this.jobRepository.find({
      relations: ['customer', 'category'],
      take: limit,
      skip: offset,
    });

    const documents = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      categoryId: job.categoryId,
      categoryName: job.category?.name || '',
      subcategoryId: job.subcategoryId || '',
      customerId: job.customerId,
      customerName: job.customer?.name || '',
      location: job.latitude && job.longitude
        ? [job.latitude, job.longitude]
        : [0, 0],
      address: job.address || '',
      city: job.city || '',
      postcode: job.postcode || '',
      budgetType: job.budgetType,
      budgetAmount: job.budgetAmount || 0,
      status: job.status,
      preferredStartDate: job.preferredStartDate
        ? Math.floor(new Date(job.preferredStartDate).getTime() / 1000)
        : undefined,
      photos: job.photos || [],
      videos: job.videos || [],
      createdAt: Math.floor(new Date(job.createdAt).getTime() / 1000),
    }));

    if (documents.length > 0) {
      await this.typesenseService.indexDocuments(JOBS_COLLECTION, documents);
      this.logger.log(`Bulk indexed ${documents.length} jobs`);
    }

    return { indexed: documents.length, hasMore: jobs.length === limit };
  }

  /**
   * Delete a product from index
   */
  async deleteProduct(productId: string) {
    return await this.typesenseService.deleteDocument(PRODUCTS_COLLECTION, productId);
  }

  /**
   * Delete a merchant from index
   */
  async deleteMerchant(merchantId: string) {
    return await this.typesenseService.deleteDocument(MERCHANTS_COLLECTION, merchantId);
  }

  /**
   * Delete a job from index
   */
  async deleteJob(jobId: string) {
    return await this.typesenseService.deleteDocument(JOBS_COLLECTION, jobId);
  }
}
