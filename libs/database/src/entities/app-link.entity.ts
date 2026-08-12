import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  MERCHANT = 'merchant',
  RIDER = 'rider',
}

@Entity('app_links')
@Index(['platform'])
export class AppLink extends BaseEntity {
  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
