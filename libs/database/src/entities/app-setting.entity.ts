import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('app_settings')
@Index(['key'])
export class AppSetting extends BaseEntity {
  @Column({ name: 'key', type: 'varchar', length: 100, unique: true, nullable: false })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;
}
