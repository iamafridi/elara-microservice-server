import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Media } from '../../../../libs/database/src/entities/media.entity';
import { FileType, StorageProvider } from './dto/upload-file.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private s3Bucket: string;
  private s3Region: string;
  private localStoragePath: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {
    this.initializeStorage();
  }

  private initializeStorage() {
    // Initialize S3
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.s3Region = this.configService.get<string>('AWS_S3_REGION') || 'ap-southeast-1';
    this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'elara-media';

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.s3Region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('AWS S3 initialized successfully');
    } else {
      this.logger.warn('AWS credentials not configured, S3 uploads will be disabled');
    }

    // Initialize local storage
    this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH') || './uploads';
    this.baseUrl = this.configService.get<string>('MEDIA_BASE_URL') || 'http://localhost:3007';

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    file: Express.Multer.File,
    fileType: FileType,
    provider: StorageProvider = StorageProvider.LOCAL,
    userId?: string,
    folder?: string,
  ) {
    // Validate file
    this.validateFile(file, fileType);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    let url: string;
    let storageKey: string;

    // Upload based on provider
    if (provider === StorageProvider.S3 && this.s3Client) {
      const result = await this.uploadToS3(file.buffer, filePath, file.mimetype);
      url = result.url;
      storageKey = result.key;
    } else {
      const result = await this.uploadToLocal(file.buffer, filePath);
      url = result.url;
      storageKey = result.path;
    }

    // Save media record to database
    const media = this.mediaRepository.create({
      fileName: file.originalname,
      filePath: storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      url,
      storageProvider: provider,
      uploadedBy: userId,
      metadata: {
        width: null,
        height: null,
        duration: null,
      },
    });

    await this.mediaRepository.save(media);

    return {
      id: media.id,
      url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageProvider: provider,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    fileType: FileType,
    provider: StorageProvider = StorageProvider.LOCAL,
    userId?: string,
    folder?: string,
  ) {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, fileType, provider, userId, folder),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Upload to S3
   */
  private async uploadToS3(buffer: Buffer, key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    const url = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;

    this.logger.log(`File uploaded to S3: ${key}`);

    return { url, key };
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(buffer: Buffer, filePath: string) {
    const fullPath = path.join(this.localStoragePath, filePath);
    const directory = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, buffer);

    const url = `${this.baseUrl}/uploads/${filePath}`;

    this.logger.log(`File uploaded to local storage: ${filePath}`);

    return { url, path: filePath };
  }

  /**
   * Delete file
   */
  async deleteFile(mediaId: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Delete from storage
    if (media.storageProvider === 's3' && this.s3Client) {
      await this.deleteFromS3(media.filePath);
    } else {
      await this.deleteFromLocal(media.filePath);
    }

    // Delete from database
    await this.mediaRepository.delete(mediaId);

    return { deleted: true };
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted from S3: ${key}`);
  }

  /**
   * Delete from local storage
   */
  private async deleteFromLocal(filePath: string) {
    const fullPath = path.join(this.localStoragePath, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.logger.log(`File deleted from local storage: ${filePath}`);
    }
  }

  /**
   * Get file buffer from storage (S3 or Local)
   * Used for image/video processing
   */
  async getFileBuffer(media: Media): Promise<Buffer> {
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    try {
      if (media.storageProvider === 's3' && this.s3Client) {
        // Fetch from S3
        return await this.getFileFromS3(media.filePath);
      } else {
        // Fetch from local storage
        return await this.getFileFromLocal(media.filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to fetch file buffer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch file from storage: ${error.message}`);
    }
  }

  /**
   * Get file from S3
   */
  private async getFileFromS3(key: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new BadRequestException('S3 client not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    this.logger.log(`File fetched from S3: ${key} (${buffer.length} bytes)`);

    return buffer;
  }

  /**
   * Get file from local storage
   */
  private async getFileFromLocal(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.localStoragePath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found in local storage: ${filePath}`);
    }

    const buffer = fs.readFileSync(fullPath);
    this.logger.log(`File fetched from local storage: ${filePath} (${buffer.length} bytes)`);

    return buffer;
  }

  /**
   * Validate file based on type
   */
  private validateFile(file: Express.Multer.File, fileType: FileType) {
    const maxSizes = {
      [FileType.IMAGE]: 10 * 1024 * 1024, // 10MB
      [FileType.VIDEO]: 100 * 1024 * 1024, // 100MB
      [FileType.DOCUMENT]: 5 * 1024 * 1024, // 5MB
      [FileType.AUDIO]: 20 * 1024 * 1024, // 20MB
    };

    const allowedMimeTypes = {
      [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      [FileType.VIDEO]: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
      [FileType.DOCUMENT]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      [FileType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    };

    // Check file size
    if (file.size > maxSizes[fileType]) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizes[fileType] / (1024 * 1024)}MB`,
      );
    }

    // Check mime type
    if (!allowedMimeTypes[fileType].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes[fileType].join(', ')}`,
      );
    }
  }

  /**
   * Get media by ID
   */
  async getMedia(mediaId: string) {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    return media;
  }

  /**
   * Get user media
   */
  async getUserMedia(userId: string, limit: number = 50, offset: number = 0) {
    const [media, total] = await this.mediaRepository.findAndCount({
      where: { uploadedBy: userId },
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
}
