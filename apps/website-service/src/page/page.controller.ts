import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageStatus } from '../../../../libs/database/src/entities/landing-page.entity';

@ApiTags('Pages')
@ApiBearerAuth()
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new landing page' })
  @ApiResponse({ status: 201, description: 'Page created' })
  createPage(@Body() dto: CreatePageDto) {
    return this.pageService.createPage(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages' })
  @ApiResponse({ status: 200, description: 'List of pages' })
  @ApiQuery({ name: 'status', required: false, enum: PageStatus })
  getAllPages(@Query('status') status?: PageStatus) {
    return this.pageService.findAll(status);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get page by slug' })
  @ApiResponse({ status: 200, description: 'Page details' })
  getPageBySlug(@Param('slug') slug: string) {
    return this.pageService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  @ApiResponse({ status: 200, description: 'Page details' })
  getPage(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update page' })
  @ApiResponse({ status: 200, description: 'Page updated' })
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pageService.updatePage(id, dto);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish page' })
  @ApiResponse({ status: 200, description: 'Page published' })
  publishPage(@Param('id') id: string) {
    return this.pageService.publishPage(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish page' })
  @ApiResponse({ status: 200, description: 'Page unpublished' })
  unpublishPage(@Param('id') id: string) {
    return this.pageService.unpublishPage(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete page' })
  @ApiResponse({ status: 200, description: 'Page deleted' })
  deletePage(@Param('id') id: string) {
    return this.pageService.deletePage(id);
  }
}
