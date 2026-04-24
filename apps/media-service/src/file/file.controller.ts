import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileService } from './file.service';

@ApiTags('File Management')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media files' })
  @ApiResponse({ status: 200, description: 'List of media files' })
  getAllMedia(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.fileService.getAllMedia(limit, offset, mimeType);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search media files' })
  @ApiResponse({ status: 200, description: 'Search results' })
  searchMedia(@Query('q') query: string, @Query('limit') limit: number = 50) {
    return this.fileService.searchMedia(query, limit);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get media by type' })
  @ApiResponse({ status: 200, description: 'Media files by type' })
  getByType(
    @Param('type') type: 'image' | 'video' | 'document' | 'audio',
    @Query('limit') limit: number = 50,
  ) {
    return this.fileService.getMediaByType(type, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: 200, description: 'Storage statistics' })
  getStorageStats() {
    return this.fileService.getStorageStats();
  }
}
