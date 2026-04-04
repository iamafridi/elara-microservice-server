import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskerPortfolio, PortfolioFileType } from '../../../../libs/database/src/entities/tasker-portfolio.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { AddPortfolioItemDto, UpdatePortfolioItemDto } from './dto/add-portfolio-item.dto';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectRepository(TaskerPortfolio)
    private portfolioRepository: Repository<TaskerPortfolio>,
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
  ) {}

  /**
   * Add a portfolio item
   */
  async addPortfolioItem(dto: AddPortfolioItemDto) {
    // Verify tasker exists
    const tasker = await this.taskerRepository.findOne({
      where: { id: dto.taskerId },
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${dto.taskerId} not found`);
    }

    // Get highest sort order
    const lastItem = await this.portfolioRepository.findOne({
      where: { taskerId: dto.taskerId },
      order: { sortOrder: 'DESC' },
    });

    const sortOrder = lastItem ? lastItem.sortOrder + 1 : 0;

    // Create portfolio item
    const portfolio = this.portfolioRepository.create({
      taskerId: dto.taskerId,
      fileUrl: dto.fileUrl,
      fileType: dto.fileType as PortfolioFileType,
      caption: dto.caption,
      sortOrder,
    });

    await this.portfolioRepository.save(portfolio);

    this.logger.log(`Portfolio item ${portfolio.id} added for tasker ${dto.taskerId}`);

    return this.findOne(portfolio.id);
  }

  /**
   * Get portfolio item by ID
   */
  async findOne(id: string) {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio item ${id} not found`);
    }

    return {
      id: portfolio.id,
      taskerId: portfolio.taskerId,
      fileUrl: portfolio.fileUrl,
      fileType: portfolio.fileType,
      caption: portfolio.caption,
      sortOrder: portfolio.sortOrder,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };
  }

  /**
   * Get all portfolio items for a tasker
   */
  async getTaskerPortfolio(taskerId: string) {
    const tasker = await this.taskerRepository.findOne({
      where: { id: taskerId },
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${taskerId} not found`);
    }

    const items = await this.portfolioRepository.find({
      where: { taskerId },
      order: { sortOrder: 'ASC' },
    });

    return {
      taskerId,
      totalItems: items.length,
      items: items.map(item => ({
        id: item.id,
        fileUrl: item.fileUrl,
        fileType: item.fileType,
        caption: item.caption,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
      })),
    };
  }

  /**
   * Update portfolio item
   */
  async updatePortfolioItem(id: string, taskerId: string, dto: UpdatePortfolioItemDto) {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio item ${id} not found`);
    }

    // Verify ownership
    if (portfolio.taskerId !== taskerId) {
      throw new BadRequestException('You can only update your own portfolio items');
    }

    // Update fields
    if (dto.caption !== undefined) portfolio.caption = dto.caption;
    if (dto.sortOrder !== undefined) portfolio.sortOrder = dto.sortOrder;

    await this.portfolioRepository.save(portfolio);

    this.logger.log(`Portfolio item ${id} updated by tasker ${taskerId}`);

    return this.findOne(id);
  }

  /**
   * Delete portfolio item
   */
  async deletePortfolioItem(id: string, taskerId: string) {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio item ${id} not found`);
    }

    // Verify ownership
    if (portfolio.taskerId !== taskerId) {
      throw new BadRequestException('You can only delete your own portfolio items');
    }

    await this.portfolioRepository.remove(portfolio);

    this.logger.log(`Portfolio item ${id} deleted by tasker ${taskerId}`);

    return { success: true, message: 'Portfolio item deleted successfully' };
  }

  /**
   * Search portfolios by file type
   */
  async searchByFileType(fileType: PortfolioFileType, limit: number = 20, offset: number = 0) {
    const items = await this.portfolioRepository.find({
      where: { fileType },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
      relations: ['tasker', 'tasker.user'],
    });

    return items.map(item => ({
      id: item.id,
      taskerId: item.taskerId,
      taskerName: item.tasker?.user ? item.tasker.user.name : null,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      caption: item.caption,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Get recent portfolio items (featured feed)
   */
  async getRecentItems(limit: number = 20, offset: number = 0) {
    const items = await this.portfolioRepository.find({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
      relations: ['tasker', 'tasker.user'],
    });

    return items.map(item => ({
      id: item.id,
      taskerId: item.taskerId,
      taskerName: item.tasker?.user ? item.tasker.user.name : null,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      caption: item.caption,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Reorder portfolio items
   */
  async reorderItems(taskerId: string, itemIds: string[]) {
    const tasker = await this.taskerRepository.findOne({
      where: { id: taskerId },
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${taskerId} not found`);
    }

    // Verify all items belong to this tasker
    const items = await this.portfolioRepository.find({
      where: { taskerId },
    });

    const itemMap = new Map(items.map(item => [item.id, item]));

    for (const itemId of itemIds) {
      if (!itemMap.has(itemId)) {
        throw new BadRequestException(`Portfolio item ${itemId} not found or does not belong to tasker`);
      }
    }

    // Update sort order
    for (let i = 0; i < itemIds.length; i++) {
      const item = itemMap.get(itemIds[i]);
      if (item) {
        item.sortOrder = i;
        await this.portfolioRepository.save(item);
      }
    }

    this.logger.log(`Portfolio items reordered for tasker ${taskerId}`);

    return { success: true, message: 'Portfolio items reordered successfully' };
  }
}
