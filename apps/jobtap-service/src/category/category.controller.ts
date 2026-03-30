import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all job categories' })
  @ApiResponse({ status: 200, description: 'Job categories' })
  getAllCategories() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  getCategory(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Get(':parentId/subcategories')
  @ApiOperation({ summary: 'Get subcategories' })
  @ApiResponse({ status: 200, description: 'Subcategories' })
  getSubcategories(@Param('parentId') parentId: string) {
    return this.categoryService.getSubcategories(parentId);
  }
}
