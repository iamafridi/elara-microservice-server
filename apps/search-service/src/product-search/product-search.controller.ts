import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductSearchService, ProductSearchParams } from './product-search.service';

@ApiTags('Product Search')
@Controller('search/products')
export class ProductSearchController {
  constructor(private readonly productSearchService: ProductSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'merchantId', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'name', 'popularity', 'rating'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  searchProducts(
    @Query('query') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('merchantId') merchantId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('sortBy') sortBy?: 'price' | 'name' | 'popularity' | 'rating',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const params: ProductSearchParams = {
      query,
      categoryId,
      merchantId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true',
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.productSearchService.searchProducts(params);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Product autocomplete' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  autocomplete(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.productSearchService.autocomplete(query, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular products' })
  @ApiResponse({ status: 200, description: 'Popular products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPopular(@Query('limit') limit?: string) {
    return this.productSearchService.getPopularProducts(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  @ApiResponse({ status: 200, description: 'Trending products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrending(@Query('limit') limit?: string) {
    return this.productSearchService.getTrendingProducts(limit ? parseInt(limit, 10) : undefined);
  }
}
