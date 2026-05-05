import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../../../libs/database/src/entities/media.entity';
import { FfmpegService } from './ffmpeg.service';
import { UploadService } from '../upload/upload.service';
import { FileType, StorageProvider } from '../upload/dto/upload-file.dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private ffmpegService: FfmpegService,
    private uploadService: UploadService,
  ) {}

  /**
   * Get video metadata
   */
  async getVideoMetadata(mediaId: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('video/')) {
      throw new BadRequestException('Media is not a video');
    }

    return {
      id: media.id,
      fileName: media.fileName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      url: media.url,
      metadata: media.metadata,
      createdAt: media.createdAt,
    };
  }

  /**
   * Generate video thumbnails
   */
  async generateThumbnail(mediaId: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('video/')) {
      throw new BadRequestException('Media is not a video');
    }

    // Get video buffer from storage
    const videoBuffer = await this.uploadService.getFileBuffer(media);

    // Generate thumbnails at 3 different timestamps
    const thumbnailBuffers = await this.ffmpegService.generateThumbnails(
      videoBuffer,
      mediaId,
      {
        timestamps: ['00:00:01', '00:00:30', '00:01:00'],
        size: '500x500',
      },
    );

    // Upload thumbnails to storage
    const uploadedThumbnails = [];
    for (let i = 0; i < thumbnailBuffers.length; i++) {
      const thumbnailBuffer = thumbnailBuffers[i];
      const file: Express.Multer.File = {
        originalname: `${media.fileName}_thumb_${i + 1}.jpg`,
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
        'video-thumbnails',
      );

      uploadedThumbnails.push(result);
    }

    this.logger.log(`Generated ${uploadedThumbnails.length} thumbnails for video ${mediaId}`);

    return {
      videoId: mediaId,
      thumbnails: uploadedThumbnails,
    };
  }

  /**
   * Convert and compress video
   */
  async convertVideo(mediaId: string, format: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    if (!media.mimeType.startsWith('video/')) {
      throw new BadRequestException('Media is not a video');
    }

    // Get video buffer from storage
    const videoBuffer = await this.uploadService.getFileBuffer(media);

    // Get video info first
    const videoInfo = await this.ffmpegService.getVideoInfo(videoBuffer, mediaId);

    // Compress video with H.264, 720p, watermark
    const compressedBuffer = await this.ffmpegService.compressVideo(
      videoBuffer,
      mediaId,
      {
        format: format || 'mp4',
        codec: 'libx264',
        width: 1280,
        height: 720,
        bitrate: '1500k',
        watermarkText: 'Made with TapMate',
      },
    );

    // Upload compressed video
    const file: Express.Multer.File = {
      originalname: `compressed_${media.fileName}`,
      buffer: compressedBuffer,
      size: compressedBuffer.length,
      mimetype: `video/${format || 'mp4'}`,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await this.uploadService.uploadFile(
      file,
      FileType.VIDEO,
      media.storageProvider as StorageProvider,
      media.uploadedBy,
      'compressed',
    );

    // Update media metadata
    await this.mediaRepository.update(result.id, {
      metadata: {
        width: 1280,
        height: 720,
        duration: videoInfo.format?.duration || null,
      },
    });

    const compressionRatio = ((1 - compressedBuffer.length / videoBuffer.length) * 100).toFixed(2);

    this.logger.log(
      `Video compressed: ${videoBuffer.length} bytes → ${compressedBuffer.length} bytes (${compressionRatio}% reduction)`,
    );

    return {
      ...result,
      originalSize: media.fileSize,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      metadata: {
        width: 1280,
        height: 720,
        duration: videoInfo.format?.duration || null,
      },
    };
  }
}
