import { Injectable, Logger } from '@nestjs/common';
import { ProductSearchService } from '../product-search/product-search.service';
import { MerchantSearchService } from '../merchant-search/merchant-search.service';
import { JobSearchService } from '../job-search/job-search.service';

export interface GlobalSearchParams {
  query: string;
  types?: ('products' | 'merchants' | 'jobs')[];
  limit?: number;
}

@Injectable()
export class GlobalSearchService {
  private readonly logger = new Logger(GlobalSearchService.name);

  constructor(
    private productSearchService: ProductSearchService,
    private merchantSearchService: MerchantSearchService,
    private jobSearchService: JobSearchService,
  ) {}

  /**
   * Global search across all entity types
   */
  async search(params: GlobalSearchParams) {
    const { query, types = ['products', 'merchants', 'jobs'], limit = 10 } = params;

    const results: any = {
      query,
      results: {},
    };

    // Search products
    if (types.includes('products')) {
      try {
        const productResults = await this.productSearchService.searchProducts({
          query,
          limit,
          offset: 0,
        });
        results.results.products = {
          data: productResults.data,
          total: productResults.total,
        };
      } catch (error) {
        this.logger.error(`Error searching products: ${error.message}`);
        results.results.products = { data: [], total: 0, error: error.message };
      }
    }

    // Search merchants
    if (types.includes('merchants')) {
      try {
        const merchantResults = await this.merchantSearchService.searchMerchants({
          query,
          limit,
          offset: 0,
        });
        results.results.merchants = {
          data: merchantResults.data,
          total: merchantResults.total,
        };
      } catch (error) {
        this.logger.error(`Error searching merchants: ${error.message}`);
        results.results.merchants = { data: [], total: 0, error: error.message };
      }
    }

    // Search jobs
    if (types.includes('jobs')) {
      try {
        const jobResults = await this.jobSearchService.searchJobs({
          query,
          limit,
          offset: 0,
        });
        results.results.jobs = {
          data: jobResults.data,
          total: jobResults.total,
        };
      } catch (error) {
        this.logger.error(`Error searching jobs: ${error.message}`);
        results.results.jobs = { data: [], total: 0, error: error.message };
      }
    }

    return results;
  }

  /**
   * Global autocomplete
   */
  async autocomplete(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return {
        products: [],
        merchants: [],
        jobs: [],
      };
    }

    const [products, merchants, jobs] = await Promise.all([
      this.productSearchService.autocomplete(query, limit).catch(() => []),
      this.merchantSearchService.autocomplete(query, limit).catch(() => []),
      this.jobSearchService.autocomplete(query, limit).catch(() => []),
    ]);

    return {
      products,
      merchants,
      jobs,
    };
  }

  /**
   * Get trending searches (simplified - returns popular items)
   */
  async getTrending() {
    const [products, merchants] = await Promise.all([
      this.productSearchService.getTrendingProducts(5).catch(() => []),
      this.merchantSearchService.getTopRated(5).catch(() => []),
    ]);

    return {
      products,
      merchants,
    };
  }
}
