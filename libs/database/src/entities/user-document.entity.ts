import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  PROOF_OF_ADDRESS = 'proof_of_address',
  BUSINESS_LICENSE = 'business_license',
  HYGIENE_CERTIFICATE = 'hygiene_certificate',
  INSURANCE = 'insurance',
  RIGHT_TO_WORK = 'right_to_work',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  HALAL_CERTIFICATION = 'halal_certification',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('user_documents')
@Index(['userId'])
@Index(['status'])
export class UserDocument extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

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

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
