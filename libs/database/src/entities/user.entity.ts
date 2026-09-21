import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserAddress } from './user-address.entity';
import { UserDevice } from './user-device.entity';
import { UserDocument } from './user-document.entity';
import { Session } from './session.entity';

export enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant',
  RIDER = 'rider',
  TASKER = 'tasker',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email'])
@Index(['phone'])
@Index(['referralCode'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  referralCode?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  referredBy?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture?: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => UserAddress, (address) => address.user)
  addresses: UserAddress[];

  @OneToMany(() => UserDevice, (device) => device.user)
  devices: UserDevice[];

  @OneToMany(() => UserDocument, (document) => document.user)
  documents: UserDocument[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
