import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { AddPortfolioItemDto, UpdatePortfolioItemDto, PortfolioFileType } from './dto/add-portfolio-item.dto';

@ApiTags('Tasker Portfolio')
@ApiBearerAuth()
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Add a portfolio item' })
  @ApiResponse({ status: 201, description: 'Portfolio item created successfully' })
  async addPortfolioItem(@Body() dto: AddPortfolioItemDto) {
    return await this.portfolioService.addPortfolioItem(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio item by ID' })
  @ApiResponse({ status: 200, description: 'Portfolio item details' })
  async getPortfolioItem(@Param('id') id: string) {
    return await this.portfolioService.findOne(id);
  }

  @Get('tasker/:taskerId')
  @ApiOperation({ summary: 'Get all portfolio items for a tasker' })
  @ApiResponse({ status: 200, description: 'Tasker portfolio items' })
  async getTaskerPortfolio(@Param('taskerId') taskerId: string) {
    return await this.portfolioService.getTaskerPortfolio(taskerId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item updated successfully' })
  async updatePortfolioItem(
    @Param('id') id: string,
    @Query('taskerId') taskerId: string,
    @Body() dto: UpdatePortfolioItemDto,
  ) {
    return await this.portfolioService.updatePortfolioItem(id, taskerId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item deleted successfully' })
  async deletePortfolioItem(
    @Param('id') id: string,
    @Query('taskerId') taskerId: string,
  ) {
    return await this.portfolioService.deletePortfolioItem(id, taskerId);
  }

  @Get()
  @ApiOperation({ summary: 'Search portfolio items by file type or get recent items' })
  @ApiResponse({ status: 200, description: 'Portfolio items' })
  async searchPortfolio(
    @Query('fileType') fileType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (fileType && (fileType === 'image' || fileType === 'video')) {
      return await this.portfolioService.searchByFileType(
        fileType as PortfolioFileType,
        limit || 20,
        offset || 0,
      );
    }

    return await this.portfolioService.getRecentItems(limit || 20, offset || 0);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder portfolio items for a tasker' })
  @ApiResponse({ status: 200, description: 'Portfolio items reordered successfully' })
  async reorderItems(
    @Body() body: { taskerId: string; itemIds: string[] },
  ) {
    return await this.portfolioService.reorderItems(body.taskerId, body.itemIds);
  }
}
