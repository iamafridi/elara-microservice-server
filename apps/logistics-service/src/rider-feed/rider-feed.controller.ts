import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RiderFeedService } from './rider-feed.service';
import { CreateFeedVideoDto, UpdateFeedVideoDto } from './dto/create-feed-video.dto';

@ApiTags('Rider Feed')
@ApiBearerAuth()
@Controller('rider-feed')
export class RiderFeedController {
  constructor(private readonly riderFeedService: RiderFeedService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a feed video post',
    description: 'Post a new video to the rider feed (TikTok-style)'
  })
  @ApiResponse({ status: 201, description: 'Feed video created successfully' })
  async createFeedVideo(@Body() dto: CreateFeedVideoDto) {
    return await this.riderFeedService.createFeedVideo(dto);
  }

  @Get('for-you')
  @ApiOperation({
    summary: 'Get For You feed',
    description: 'Get personalized feed videos (TikTok For You page)'
  })
  @ApiResponse({ status: 200, description: 'Feed videos' })
  async getForYouFeed(
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.riderFeedService.getFeedVideos(userId, limit || 20, offset || 0);
  }

  @Get('rider/:riderId')
  @ApiOperation({
    summary: 'Get rider\'s videos',
    description: 'Get all videos posted by a specific rider'
  })
  @ApiResponse({ status: 200, description: 'Rider videos' })
  async getRiderVideos(
    @Param('riderId') riderId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.riderFeedService.getRiderVideos(riderId, limit || 20, offset || 0);
  }

  @Get('hashtag/:hashtag')
  @ApiOperation({
    summary: 'Search by hashtag',
    description: 'Find videos by hashtag (e.g., #delivery, #tapmate)'
  })
  @ApiResponse({ status: 200, description: 'Videos with hashtag' })
  async searchByHashtag(
    @Param('hashtag') hashtag: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.riderFeedService.searchByHashtag(hashtag, limit || 20, offset || 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feed video by ID' })
  @ApiResponse({ status: 200, description: 'Feed video details' })
  async getFeedVideo(@Param('id') id: string) {
    return await this.riderFeedService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feed video' })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  async updateFeedVideo(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
    @Body() dto: UpdateFeedVideoDto,
  ) {
    return await this.riderFeedService.updateFeedVideo(id, riderId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feed video' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  async deleteFeedVideo(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
  ) {
    return await this.riderFeedService.deleteFeedVideo(id, riderId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a video' })
  @ApiResponse({ status: 200, description: 'Video liked successfully' })
  async likeVideo(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
  ) {
    return await this.riderFeedService.likeVideo(id, riderId);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a video' })
  @ApiResponse({ status: 200, description: 'Video unliked successfully' })
  async unlikeVideo(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
  ) {
    return await this.riderFeedService.unlikeVideo(id, riderId);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Add comment to video' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async addComment(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
    @Body('commentText') commentText: string,
  ) {
    return await this.riderFeedService.addComment(id, riderId, commentText);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get video comments' })
  @ApiResponse({ status: 200, description: 'Video comments' })
  async getComments(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.riderFeedService.getComments(id, limit || 50, offset || 0);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  async incrementViewCount(@Param('id') id: string) {
    return await this.riderFeedService.incrementViewCount(id);
  }
}
