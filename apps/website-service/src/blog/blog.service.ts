import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { BlogPost } from '../../../../libs/database/src/entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) {}

  /**
   * Create a new blog post
   */
  async createPost(dto: CreateBlogPostDto) {
    // Check if slug already exists
    const existing = await this.blogRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(`Blog post with slug '${dto.slug}' already exists`);
    }

    const post = this.blogRepository.create({
      slug: dto.slug,
      title: dto.title,
      content: dto.content,
      author: dto.author,
      metaDescription: dto.metaDescription,
      featuredImage: dto.featuredImage,
      tags: dto.tags || [],
    });

    await this.blogRepository.save(post);

    this.logger.log(`Blog post created: ${post.slug}`);

    return this.findOne(post.id);
  }

  /**
   * Get blog post by ID
   */
  async findOne(id: string) {
    const post = await this.blogRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Blog post ${id} not found`);
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      author: post.author,
      metaDescription: post.metaDescription,
      featuredImage: post.featuredImage,
      tags: post.tags,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  /**
   * Get blog post by slug
   */
  async findBySlug(slug: string) {
    const post = await this.blogRepository.findOne({
      where: { slug },
    });

    if (!post) {
      throw new NotFoundException(`Blog post '${slug}' not found`);
    }

    return this.findOne(post.id);
  }

  /**
   * Get all blog posts
   */
  async findAll(published?: boolean, tag?: string) {
    const queryBuilder = this.blogRepository.createQueryBuilder('post');

    if (published) {
      queryBuilder.where('post.publishedAt IS NOT NULL');
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(post.tags)', { tag });
    }

    queryBuilder.orderBy('post.publishedAt', 'DESC', 'NULLS LAST');
    queryBuilder.addOrderBy('post.createdAt', 'DESC');

    const posts = await queryBuilder.getMany();

    return posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      author: post.author,
      metaDescription: post.metaDescription,
      featuredImage: post.featuredImage,
      tags: post.tags,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
    }));
  }

  /**
   * Search blog posts
   */
  async search(query: string) {
    const posts = await this.blogRepository.find({
      where: [
        { title: ILike(`%${query}%`), publishedAt: null },
        { content: ILike(`%${query}%`), publishedAt: null },
      ],
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: 20,
    });

    return posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      metaDescription: post.metaDescription,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
    }));
  }

  /**
   * Update blog post
   */
  async updatePost(id: string, dto: UpdateBlogPostDto) {
    const post = await this.blogRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Blog post ${id} not found`);
    }

    if (dto.title) post.title = dto.title;
    if (dto.content) post.content = dto.content;
    if (dto.author) post.author = dto.author;
    if (dto.metaDescription !== undefined) post.metaDescription = dto.metaDescription;
    if (dto.featuredImage !== undefined) post.featuredImage = dto.featuredImage;
    if (dto.tags !== undefined) post.tags = dto.tags;

    await this.blogRepository.save(post);

    this.logger.log(`Blog post updated: ${post.slug}`);

    return this.findOne(id);
  }

  /**
   * Publish blog post
   */
  async publishPost(id: string) {
    const post = await this.blogRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Blog post ${id} not found`);
    }

    post.publishedAt = new Date();

    await this.blogRepository.save(post);

    this.logger.log(`Blog post published: ${post.slug}`);

    return this.findOne(id);
  }

  /**
   * Unpublish blog post
   */
  async unpublishPost(id: string) {
    const post = await this.blogRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Blog post ${id} not found`);
    }

    post.publishedAt = null;

    await this.blogRepository.save(post);

    this.logger.log(`Blog post unpublished: ${post.slug}`);

    return this.findOne(id);
  }

  /**
   * Delete blog post
   */
  async deletePost(id: string) {
    const post = await this.blogRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Blog post ${id} not found`);
    }

    await this.blogRepository.remove(post);

    this.logger.log(`Blog post deleted: ${post.slug}`);

    return { message: 'Blog post deleted successfully' };
  }

  /**
   * Get all tags
   */
  async getAllTags() {
    const posts = await this.blogRepository.find({
      select: ['tags'],
    });

    const tagsSet = new Set<string>();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  }
}
