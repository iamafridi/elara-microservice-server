import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/create-variant.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('merchantId') merchantId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.productService.findAll(limit, offset, merchantId, categoryId, search, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'Get merchant products' })
  @ApiResponse({ status: 200, description: 'Merchant products' })
  findByMerchant(
    @Param('merchantId') merchantId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.productService.findByMerchant(merchantId, limit, offset);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get category products' })
  @ApiResponse({ status: 200, description: 'Category products' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.productService.findByCategory(categoryId, limit, offset);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productService.updateStock(id, quantity);
  }

  // ========== VARIANT MANAGEMENT ==========

  @Post('variants')
  @ApiOperation({
    summary: 'Create a product variant',
    description: 'Create a variant for a product (e.g., size, color)'
  })
  @ApiResponse({ status: 201, description: 'Variant created' })
  createVariant(@Body() dto: CreateVariantDto) {
    return this.productService.createVariant(dto);
  }

  @Get(':productId/variants')
  @ApiOperation({
    summary: 'Get all variants for a product',
    description: 'Retrieve all variants (sizes, colors, etc.) for a specific product'
  })
  @ApiResponse({ status: 200, description: 'Product variants' })
  getProductVariants(@Param('productId') productId: string) {
    return this.productService.getProductVariants(productId);
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Get variant by ID' })
  @ApiResponse({ status: 200, description: 'Variant details' })
  findVariant(@Param('id') id: string) {
    return this.productService.findVariant(id);
  }

  @Put('variants/:id')
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiResponse({ status: 200, description: 'Variant updated' })
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.productService.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Delete a variant (soft delete)' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  removeVariant(@Param('id') id: string) {
    return this.productService.removeVariant(id);
  }

  @Put('variants/:id/stock')
  @ApiOperation({ summary: 'Update variant stock' })
  @ApiResponse({ status: 200, description: 'Variant stock updated' })
  updateVariantStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productService.updateVariantStock(id, quantity);
  }
}
