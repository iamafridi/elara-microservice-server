import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DocumentType, DocumentStatus } from './user-document.entity';

@Entity('rider_documents')
@Index(['riderId'])
@Index(['status'])
export class RiderDocument extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason?: string;

  @Column({ type: 'uuid', nullable: true })
  verifiedByAdminId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;
}
