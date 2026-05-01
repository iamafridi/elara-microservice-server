import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
}

export class UploadFileDto {
  @ApiProperty({ description: 'File type', enum: FileType })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiProperty({ description: 'Storage provider', enum: StorageProvider, required: false })
  @IsEnum(StorageProvider)
  @IsOptional()
  provider?: StorageProvider;

  @ApiProperty({ description: 'User ID uploading the file', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Folder path', required: false })
  @IsString()
  @IsOptional()
  folder?: string;
}
