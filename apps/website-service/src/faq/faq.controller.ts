import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@ApiTags('FAQ')
@ApiBearerAuth()
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiResponse({ status: 201, description: 'FAQ created' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqService.createFaq(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FAQs' })
  @ApiResponse({ status: 200, description: 'List of FAQs' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  getAllFaqs(
    @Query('category') category?: string,
    @Query('active') active?: string,
  ) {
    return this.faqService.findAll(category, active === 'true');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search FAQs' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'query', required: true, type: String })
  searchFaqs(@Query('query') query: string) {
    return this.faqService.search(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all FAQ categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  getAllCategories() {
    return this.faqService.getAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by ID' })
  @ApiResponse({ status: 200, description: 'FAQ details' })
  getFaq(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ updated' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.updateFaq(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ deleted' })
  deleteFaq(@Param('id') id: string) {
    return this.faqService.deleteFaq(id);
  }
}
