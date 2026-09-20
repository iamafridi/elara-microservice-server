import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

@Entity('user_devices')
@Index(['userId'])
@Index(['deviceId'])
export class UserDevice extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  deviceId: string;

  @Column({ type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fcmToken?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceModel?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  osVersion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  appVersion?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActive?: Date;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
