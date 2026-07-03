import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@ApiTags('Blog')
@ApiBearerAuth()
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Blog post created' })
  createPost(@Body() dto: CreateBlogPostDto) {
    return this.blogService.createPost(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({ status: 200, description: 'List of blog posts' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'tag', required: false, type: String })
  getAllPosts(
    @Query('published') published?: string,
    @Query('tag') tag?: string,
  ) {
    return this.blogService.findAll(published === 'true', tag);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search blog posts' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'query', required: true, type: String })
  searchPosts(@Query('query') query: string) {
    return this.blogService.search(query);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  getAllTags() {
    return this.blogService.getAllTags();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post details' })
  getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog post by ID' })
  @ApiResponse({ status: 200, description: 'Blog post details' })
  getPost(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update blog post' })
  @ApiResponse({ status: 200, description: 'Blog post updated' })
  updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish blog post' })
  @ApiResponse({ status: 200, description: 'Blog post published' })
  publishPost(@Param('id') id: string) {
    return this.blogService.publishPost(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish blog post' })
  @ApiResponse({ status: 200, description: 'Blog post unpublished' })
  unpublishPost(@Param('id') id: string) {
    return this.blogService.unpublishPost(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete blog post' })
  @ApiResponse({ status: 200, description: 'Blog post deleted' })
  deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }
}
