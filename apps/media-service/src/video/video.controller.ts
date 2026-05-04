import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VideoService } from './video.service';

@ApiTags('Video Processing')
@ApiBearerAuth()
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get video metadata' })
  @ApiResponse({ status: 200, description: 'Video metadata' })
  getMetadata(@Param('id') id: string) {
    return this.videoService.getVideoMetadata(id);
  }

  @Post(':id/thumbnail')
  @ApiOperation({ summary: 'Generate video thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail generated' })
  generateThumbnail(@Param('id') id: string) {
    return this.videoService.generateThumbnail(id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert video format' })
  @ApiResponse({ status: 200, description: 'Video conversion started' })
  convertVideo(@Param('id') id: string, @Query('format') format: string) {
    return this.videoService.convertVideo(id, format);
  }
}
