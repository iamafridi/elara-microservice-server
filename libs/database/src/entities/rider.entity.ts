import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { RiderEarning } from './rider-earning.entity';

export enum VehicleType {
  BICYCLE = 'bicycle',
  MOTORBIKE = 'motorbike',
  CAR = 'car',
  VAN = 'van',
}

export enum RiderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
}

export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

@Entity('riders')
@Index(['userId'])
@Index(['status'])
@Index(['onlineStatus'])
@Index(['currentLatitude', 'currentLongitude'])
export class Rider extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vehicleMake?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vehicleModel?: string;

  @Column({ type: 'enum', enum: RiderStatus, default: RiderStatus.PENDING })
  status: RiderStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'boolean', default: false })
  documentsVerified: boolean;

  @Column({ type: 'enum', enum: OnlineStatus, default: OnlineStatus.OFFLINE })
  onlineStatus: OnlineStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude?: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLocationUpdate?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeAccountId?: string;

  @Column({ type: 'jsonb', nullable: true })
  bankDetails?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => RiderEarning, (earning) => earning.rider)
  earnings: RiderEarning[];
}
