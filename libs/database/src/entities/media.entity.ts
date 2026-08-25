import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('media')
@Index(['uploadedBy'])
@Index(['storageProvider'])
export class Media extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 20 })
  storageProvider: string; // 'local' or 's3'

  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    width: number | null;
    height: number | null;
    duration: number | null;
  };
}
