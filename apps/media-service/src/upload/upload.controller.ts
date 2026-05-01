import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { FileType, StorageProvider } from './dto/upload-file.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: Object.values(FileType),
        },
        provider: {
          type: 'string',
          enum: Object.values(StorageProvider),
        },
        userId: {
          type: 'string',
        },
        folder: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: FileType,
    @Body('provider') provider?: StorageProvider,
    @Body('userId') userId?: string,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.uploadFile(file, fileType, provider, userId, folder);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        fileType: {
          type: 'string',
          enum: Object.values(FileType),
        },
        provider: {
          type: 'string',
          enum: Object.values(StorageProvider),
        },
        userId: {
          type: 'string',
        },
        folder: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fileType') fileType: FileType,
    @Body('provider') provider?: StorageProvider,
    @Body('userId') userId?: string,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.uploadMultipleFiles(files, fileType, provider, userId, folder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiResponse({ status: 200, description: 'Media details' })
  getMedia(@Param('id') id: string) {
    return this.uploadService.getMedia(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user media' })
  @ApiResponse({ status: 200, description: 'User media list' })
  getUserMedia(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.uploadService.getUserMedia(userId, limit, offset);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  @ApiResponse({ status: 200, description: 'Media deleted' })
  deleteMedia(@Param('id') id: string) {
    return this.uploadService.deleteFile(id);
  }
}
