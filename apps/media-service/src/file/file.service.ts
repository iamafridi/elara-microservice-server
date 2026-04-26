import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Media } from '../../../../libs/database/src/entities/media.entity';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  /**
   * Get all media files
   */
  async getAllMedia(
    limit: number = 50,
    offset: number = 0,
    mimeType?: string,
  ) {
    const where = mimeType ? { mimeType: Like(`${mimeType}%`) } : {};

    const [media, total] = await this.mediaRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: media,
      total,
      limit,
      offset,
    };
  }

  /**
   * Search media files
   */
  async searchMedia(query: string, limit: number = 50) {
    const media = await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.fileName LIKE :query', { query: `%${query}%` })
      .orderBy('media.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return media;
  }

  /**
   * Get media by type
   */
  async getMediaByType(type: 'image' | 'video' | 'document' | 'audio', limit: number = 50) {
    const media = await this.mediaRepository.find({
      where: { mimeType: Like(`${type}%`) },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return media;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const totalFiles = await this.mediaRepository.count();

    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.fileSize)', 'totalSize')
      .getRawOne();

    const totalSize = parseInt(result.totalSize) || 0;

    const byType = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SPLIT_PART(media.mimeType, \'/\', 1)', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(media.fileSize)', 'size')
      .groupBy('type')
      .getRawMany();

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      byType: byType.map(t => ({
        type: t.type,
        count: parseInt(t.count),
        size: parseInt(t.size),
        sizeFormatted: this.formatBytes(parseInt(t.size)),
      })),
    };
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
