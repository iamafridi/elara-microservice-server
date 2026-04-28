import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ImageService } from './image.service';
import { ResizeImageDto, CompressImageDto, ThumbnailDto, ImageFormat } from './dto/process-image.dto';

@ApiTags('Image Processing')
@ApiBearerAuth()
@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post(':id/resize')
  @ApiOperation({ summary: 'Resize image' })
  @ApiResponse({ status: 200, description: 'Image resized' })
  resizeImage(@Param('id') id: string, @Body() dto: ResizeImageDto) {
    return this.imageService.resizeImage(id, dto);
  }

  @Post(':id/compress')
  @ApiOperation({ summary: 'Compress image' })
  @ApiResponse({ status: 200, description: 'Image compressed' })
  compressImage(@Param('id') id: string, @Body() dto: CompressImageDto) {
    return this.imageService.compressImage(id, dto);
  }

  @Post(':id/thumbnail')
  @ApiOperation({ summary: 'Create thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail created' })
  createThumbnail(@Param('id') id: string, @Body() dto: ThumbnailDto) {
    return this.imageService.createThumbnail(id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert image format' })
  @ApiResponse({ status: 200, description: 'Image format converted' })
  convertFormat(
    @Param('id') id: string,
    @Query('format') format: ImageFormat,
    @Query('quality') quality: number = 80,
  ) {
    return this.imageService.convertFormat(id, format, quality);
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get image metadata' })
  @ApiResponse({ status: 200, description: 'Image metadata' })
  getMetadata(@Param('id') id: string) {
    return this.imageService.getImageMetadata(id);
  }
}
