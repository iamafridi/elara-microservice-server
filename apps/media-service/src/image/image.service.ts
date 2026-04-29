import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as sharp from 'sharp';
import { Media } from '../../../../libs/database/src/entities/media.entity';
import { UploadService } from '../upload/upload.service';
import { ImageFormat, ResizeImageDto, CompressImageDto, ThumbnailDto } from './dto/process-image.dto';
import { FileType, StorageProvider } from '../upload/dto/upload-file.dto';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private uploadService: UploadService,
  ) {}

  /**
   * Resize image
   */
  async resizeImage(mediaId: string, dto: ResizeImageDto) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media is not an image');
    }

    // Get original image buffer (you'd need to fetch from storage)
    // For now, we'll assume it's accessible locally
    const imageBuffer = await this.getImageBuffer(media);

    // Process image
    let processor = sharp(imageBuffer);

    if (dto.width || dto.height) {
      processor = processor.resize(dto.width, dto.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (dto.format) {
      processor = processor.toFormat(dto.format, {
        quality: dto.quality || 80,
      });
    } else if (dto.quality) {
      processor = processor.jpeg({ quality: dto.quality });
    }

    const processedBuffer = await processor.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    // Upload processed image
    const file: Express.Multer.File = {
      originalname: `resized_${media.fileName}`,
      buffer: processedBuffer,
      size: processedBuffer.length,
      mimetype: dto.format ? `image/${dto.format}` : media.mimeType,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await this.uploadService.uploadFile(
      file,
      FileType.IMAGE,
      media.storageProvider as StorageProvider,
      media.uploadedBy,
      'processed',
    );

    // Update media metadata
    await this.mediaRepository.update(result.id, {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        duration: null,
      },
    });

    return result;
  }

  /**
   * Compress image
   */
  async compressImage(mediaId: string, dto: CompressImageDto) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media is not an image');
    }

    const imageBuffer = await this.getImageBuffer(media);

    let processor = sharp(imageBuffer);

    const quality = dto.quality || 70;
    const format = dto.format || ImageFormat.JPEG;

    processor = processor.toFormat(format, { quality });

    const compressedBuffer = await processor.toBuffer();
    const metadata = await sharp(compressedBuffer).metadata();

    const file: Express.Multer.File = {
      originalname: `compressed_${media.fileName}`,
      buffer: compressedBuffer,
      size: compressedBuffer.length,
      mimetype: `image/${format}`,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await this.uploadService.uploadFile(
      file,
      FileType.IMAGE,
      media.storageProvider as StorageProvider,
      media.uploadedBy,
      'compressed',
    );

    await this.mediaRepository.update(result.id, {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        duration: null,
      },
    });

    return {
      ...result,
      originalSize: media.fileSize,
      compressedSize: compressedBuffer.length,
      compressionRatio: ((1 - compressedBuffer.length / media.fileSize) * 100).toFixed(2) + '%',
    };
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(mediaId: string, dto: ThumbnailDto) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media is not an image');
    }

    const imageBuffer = await this.getImageBuffer(media);

    const width = dto.width || 200;
    const height = dto.height || 200;

    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const metadata = await sharp(thumbnailBuffer).metadata();

    const file: Express.Multer.File = {
      originalname: `thumb_${media.fileName}`,
      buffer: thumbnailBuffer,
      size: thumbnailBuffer.length,
      mimetype: 'image/jpeg',
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await this.uploadService.uploadFile(
      file,
      FileType.IMAGE,
      media.storageProvider as StorageProvider,
      media.uploadedBy,
      'thumbnails',
    );

    await this.mediaRepository.update(result.id, {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        duration: null,
      },
    });

    return result;
  }

  /**
   * Convert image format
   */
  async convertFormat(mediaId: string, format: ImageFormat, quality: number = 80) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media is not an image');
    }

    const imageBuffer = await this.getImageBuffer(media);

    const convertedBuffer = await sharp(imageBuffer)
      .toFormat(format, { quality })
      .toBuffer();

    const metadata = await sharp(convertedBuffer).metadata();

    const file: Express.Multer.File = {
      originalname: media.fileName.replace(/\.[^.]+$/, `.${format}`),
      buffer: convertedBuffer,
      size: convertedBuffer.length,
      mimetype: `image/${format}`,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await this.uploadService.uploadFile(
      file,
      FileType.IMAGE,
      media.storageProvider as StorageProvider,
      media.uploadedBy,
      'converted',
    );

    await this.mediaRepository.update(result.id, {
      metadata: {
        width: metadata.width,
        height: metadata.height,
        duration: null,
      },
    });

    return result;
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(mediaId: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media is not an image');
    }

    const imageBuffer = await this.getImageBuffer(media);
    const metadata = await sharp(imageBuffer).metadata();

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: metadata.size,
    };
  }

  /**
   * Get image buffer from storage (S3 or local)
   * Uses UploadService to fetch from the appropriate storage provider
   */
  private async getImageBuffer(media: Media): Promise<Buffer> {
    return await this.uploadService.getFileBuffer(media);
  }
}
