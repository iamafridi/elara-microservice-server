import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingPage, PageStatus } from '../../../../libs/database/src/entities/landing-page.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PageService {
  private readonly logger = new Logger(PageService.name);

  constructor(
    @InjectRepository(LandingPage)
    private pageRepository: Repository<LandingPage>,
  ) {}

  /**
   * Create a new landing page
   */
  async createPage(dto: CreatePageDto) {
    // Check if slug already exists
    const existing = await this.pageRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(`Page with slug '${dto.slug}' already exists`);
    }

    const page = this.pageRepository.create({
      slug: dto.slug,
      title: dto.title,
      metaDescription: dto.metaDescription,
      h1: dto.h1,
      content: dto.content,
      schema: dto.schema,
      moduleType: dto.moduleType,
      city: dto.city,
      postcode: dto.postcode,
      status: PageStatus.DRAFT,
    });

    await this.pageRepository.save(page);

    this.logger.log(`Page created: ${page.slug}`);

    return this.findOne(page.id);
  }

  /**
   * Get page by ID
   */
  async findOne(id: string) {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription,
      h1: page.h1,
      content: page.content,
      schema: page.schema,
      moduleType: page.moduleType,
      city: page.city,
      postcode: page.postcode,
      status: page.status,
      publishedAt: page.publishedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  /**
   * Get page by slug
   */
  async findBySlug(slug: string) {
    const page = await this.pageRepository.findOne({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException(`Page '${slug}' not found`);
    }

    return this.findOne(page.id);
  }

  /**
   * Get all pages
   */
  async findAll(status?: PageStatus) {
    const queryBuilder = this.pageRepository.createQueryBuilder('page');

    if (status) {
      queryBuilder.where('page.status = :status', { status });
    }

    queryBuilder.orderBy('page.createdAt', 'DESC');

    const pages = await queryBuilder.getMany();

    return pages.map(page => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      moduleType: page.moduleType,
      city: page.city,
      status: page.status,
      publishedAt: page.publishedAt,
      createdAt: page.createdAt,
    }));
  }

  /**
   * Update page
   */
  async updatePage(id: string, dto: UpdatePageDto) {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }

    if (dto.title) page.title = dto.title;
    if (dto.metaDescription !== undefined) page.metaDescription = dto.metaDescription;
    if (dto.h1) page.h1 = dto.h1;
    if (dto.content) page.content = dto.content;
    if (dto.schema !== undefined) page.schema = dto.schema;
    if (dto.moduleType) page.moduleType = dto.moduleType;
    if (dto.city !== undefined) page.city = dto.city;
    if (dto.postcode !== undefined) page.postcode = dto.postcode;

    await this.pageRepository.save(page);

    this.logger.log(`Page updated: ${page.slug}`);

    return this.findOne(id);
  }

  /**
   * Publish page
   */
  async publishPage(id: string) {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }

    page.status = PageStatus.PUBLISHED;
    page.publishedAt = new Date();

    await this.pageRepository.save(page);

    this.logger.log(`Page published: ${page.slug}`);

    return this.findOne(id);
  }

  /**
   * Unpublish page
   */
  async unpublishPage(id: string) {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }

    page.status = PageStatus.DRAFT;

    await this.pageRepository.save(page);

    this.logger.log(`Page unpublished: ${page.slug}`);

    return this.findOne(id);
  }

  /**
   * Delete page
   */
  async deletePage(id: string) {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }

    await this.pageRepository.remove(page);

    this.logger.log(`Page deleted: ${page.slug}`);

    return { message: 'Page deleted successfully' };
  }
}
