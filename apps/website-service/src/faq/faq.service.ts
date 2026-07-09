import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Faq } from '../../../../libs/database/src/entities/faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,
  ) {}

  /**
   * Create a new FAQ
   */
  async createFaq(dto: CreateFaqDto) {
    const faq = this.faqRepository.create({
      question: dto.question,
      answer: dto.answer,
      category: dto.category,
      sortOrder: dto.sortOrder || 0,
      isActive: dto.isActive ?? true,
    });

    await this.faqRepository.save(faq);

    this.logger.log(`FAQ created: ${faq.id}`);

    return this.findOne(faq.id);
  }

  /**
   * Get FAQ by ID
   */
  async findOne(id: string) {
    const faq = await this.faqRepository.findOne({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ ${id} not found`);
    }

    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    };
  }

  /**
   * Get all FAQs
   */
  async findAll(category?: string, active?: boolean) {
    const queryBuilder = this.faqRepository.createQueryBuilder('faq');

    if (category) {
      queryBuilder.where('faq.category = :category', { category });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('faq.isActive = :isActive', { isActive: active });
    }

    queryBuilder.orderBy('faq.sortOrder', 'ASC');
    queryBuilder.addOrderBy('faq.createdAt', 'DESC');

    const faqs = await queryBuilder.getMany();

    return faqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    }));
  }

  /**
   * Search FAQs
   */
  async search(query: string) {
    const faqs = await this.faqRepository.find({
      where: [
        { question: ILike(`%${query}%`), isActive: true },
        { answer: ILike(`%${query}%`), isActive: true },
      ],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      take: 20,
    });

    return faqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    }));
  }

  /**
   * Update FAQ
   */
  async updateFaq(id: string, dto: UpdateFaqDto) {
    const faq = await this.faqRepository.findOne({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ ${id} not found`);
    }

    if (dto.question) faq.question = dto.question;
    if (dto.answer) faq.answer = dto.answer;
    if (dto.category !== undefined) faq.category = dto.category;
    if (dto.sortOrder !== undefined) faq.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) faq.isActive = dto.isActive;

    await this.faqRepository.save(faq);

    this.logger.log(`FAQ updated: ${faq.id}`);

    return this.findOne(id);
  }

  /**
   * Delete FAQ
   */
  async deleteFaq(id: string) {
    const faq = await this.faqRepository.findOne({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ ${id} not found`);
    }

    await this.faqRepository.remove(faq);

    this.logger.log(`FAQ deleted: ${faq.id}`);

    return { message: 'FAQ deleted successfully' };
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const faqs = await this.faqRepository
      .createQueryBuilder('faq')
      .select('DISTINCT faq.category', 'category')
      .where('faq.category IS NOT NULL')
      .getRawMany();

    return faqs.map(f => f.category).filter(c => c).sort();
  }
}
