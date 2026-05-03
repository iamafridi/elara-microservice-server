import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface ThumbnailOptions {
  timestamps: string[];
  size?: string;
  folder?: string;
}

export interface VideoConversionOptions {
  format?: string;
  codec?: string;
  width?: number;
  height?: number;
  bitrate?: string;
  quality?: number;
  watermarkText?: string;
}

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp');

  constructor() {
    this.ensureTempDirectory();
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDirectory() {
    if (!fs.existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
      this.logger.log(`Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Generate video thumbnail(s)
   * @param videoBuffer - The video file buffer
   * @param mediaId - Media ID for temp file naming
   * @param options - Thumbnail generation options
   * @returns Array of thumbnail buffers
   */
  async generateThumbnails(
    videoBuffer: Buffer,
    mediaId: string,
    options: ThumbnailOptions = { timestamps: ['00:00:01', '00:00:30', '00:01:00'] },
  ): Promise<Buffer[]> {
    const tempVideoPath = path.join(this.tempDir, `${mediaId}-input.mp4`);
    const thumbnailFiles: string[] = [];
    const thumbnailBuffers: Buffer[] = [];

    try {
      // Write video to temp file
      await writeFile(tempVideoPath, videoBuffer);
      this.logger.log(`Temp video file created: ${tempVideoPath}`);

      // Generate thumbnails for each timestamp
      for (const timestamp of options.timestamps) {
        const thumbnailFileName = `${mediaId}-thumb-${timestamp.replace(/:/g, '-')}.jpg`;
        const thumbnailPath = path.join(this.tempDir, thumbnailFileName);
        thumbnailFiles.push(thumbnailPath);

        await this.generateSingleThumbnail(tempVideoPath, thumbnailPath, timestamp, options.size || '500x500');
      }

      // Read all generated thumbnails into buffers
      for (const thumbnailFile of thumbnailFiles) {
        if (fs.existsSync(thumbnailFile)) {
          const buffer = await readFile(thumbnailFile);
          thumbnailBuffers.push(buffer);
          this.logger.log(`Thumbnail generated: ${path.basename(thumbnailFile)} (${buffer.length} bytes)`);
        }
      }

      return thumbnailBuffers;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnails: ${error.message}`, error.stack);
      throw new BadRequestException(`Thumbnail generation failed: ${error.message}`);
    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles([tempVideoPath, ...thumbnailFiles]);
    }
  }

  /**
   * Generate a single thumbnail at a specific timestamp
   */
  private async generateSingleThumbnail(
    videoPath: string,
    outputPath: string,
    timestamp: string,
    size: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size,
        })
        .on('end', () => {
          this.logger.log(`Thumbnail created at ${timestamp}`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Thumbnail generation error: ${err.message}`);
          reject(err);
        });
    });
  }

  /**
   * Compress and convert video
   * @param videoBuffer - The video file buffer
   * @param mediaId - Media ID for temp file naming
   * @param options - Video conversion options
   * @returns Compressed video buffer
   */
  async compressVideo(
    videoBuffer: Buffer,
    mediaId: string,
    options: VideoConversionOptions = {},
  ): Promise<Buffer> {
    const tempInputPath = path.join(this.tempDir, `${mediaId}-input.mp4`);
    const format = options.format || 'mp4';
    const tempOutputPath = path.join(this.tempDir, `${mediaId}-output.${format}`);

    try {
      // Write input video to temp file
      await writeFile(tempInputPath, videoBuffer);
      this.logger.log(`Temp input video created: ${tempInputPath}`);

      // Process video
      await this.processVideo(tempInputPath, tempOutputPath, options);

      // Read processed video
      const outputBuffer = await readFile(tempOutputPath);
      const compressionRatio = ((1 - outputBuffer.length / videoBuffer.length) * 100).toFixed(2);

      this.logger.log(
        `Video compressed: ${videoBuffer.length} bytes → ${outputBuffer.length} bytes (${compressionRatio}% reduction)`,
      );

      return outputBuffer;
    } catch (error) {
      this.logger.error(`Failed to compress video: ${error.message}`, error.stack);
      throw new BadRequestException(`Video compression failed: ${error.message}`);
    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles([tempInputPath, tempOutputPath]);
    }
  }

  /**
   * Process video with ffmpeg
   */
  private async processVideo(inputPath: string, outputPath: string, options: VideoConversionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Set video codec (default: H.264)
      const codec = options.codec || 'libx264';
      command = command.videoCodec(codec);

      // Set resolution (default: 720p - 1280x720)
      const width = options.width || 1280;
      const height = options.height || 720;
      command = command.size(`${width}x${height}`);

      // Set bitrate (default: 1500k)
      const bitrate = options.bitrate || '1500k';
      command = command.videoBitrate(bitrate);

      // Set format
      const format = options.format || 'mp4';
      command = command.format(format);

      // Add audio codec
      command = command.audioCodec('aac').audioBitrate('128k');

      // Add watermark if specified
      if (options.watermarkText) {
        command = this.addWatermark(command, options.watermarkText);
      }

      // Output
      command
        .on('start', (commandLine) => {
          this.logger.log(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.log(`Processing: ${progress.percent.toFixed(2)}% done`);
          }
        })
        .on('end', () => {
          this.logger.log('Video processing completed successfully');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Add text watermark to video
   */
  private addWatermark(command: ffmpeg.FfmpegCommand, text: string): ffmpeg.FfmpegCommand {
    // Add watermark text at bottom right corner
    // Using drawtext filter
    const filterComplex = [
      `drawtext=text='${text}':fontsize=24:fontcolor=white@0.8:` +
        `x=(w-text_w-20):y=(h-text_h-20):` +
        `shadowcolor=black@0.8:shadowx=2:shadowy=2`,
    ].join('');

    return command.videoFilters(filterComplex);
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoBuffer: Buffer, mediaId: string): Promise<any> {
    const tempVideoPath = path.join(this.tempDir, `${mediaId}-probe.mp4`);

    try {
      await writeFile(tempVideoPath, videoBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to get video info: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get video info: ${error.message}`);
    } finally {
      await this.cleanupTempFiles([tempVideoPath]);
    }
  }

  /**
   * Extract audio from video
   */
  async extractAudio(videoBuffer: Buffer, mediaId: string, format: string = 'mp3'): Promise<Buffer> {
    const tempInputPath = path.join(this.tempDir, `${mediaId}-input.mp4`);
    const tempOutputPath = path.join(this.tempDir, `${mediaId}-audio.${format}`);

    try {
      await writeFile(tempInputPath, videoBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInputPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .format(format)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(tempOutputPath);
      });

      const audioBuffer = await readFile(tempOutputPath);
      this.logger.log(`Audio extracted: ${audioBuffer.length} bytes`);

      return audioBuffer;
    } catch (error) {
      this.logger.error(`Failed to extract audio: ${error.message}`, error.stack);
      throw new BadRequestException(`Audio extraction failed: ${error.message}`);
    } finally {
      await this.cleanupTempFiles([tempInputPath, tempOutputPath]);
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          await unlink(file);
          this.logger.log(`Cleaned up temp file: ${path.basename(file)}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup temp file ${file}: ${error.message}`);
      }
    }
  }
}
