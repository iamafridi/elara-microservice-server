import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DeviceType } from './user-device.entity';

@Entity('notification_tokens')
@Index(['userId'])
@Index(['fcmToken'])
export class NotificationToken extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  deviceId: string;

  @Column({ type: 'varchar', length: 500 })
  fcmToken: string;

  @Column({ type: 'enum', enum: DeviceType })
  platform: DeviceType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
