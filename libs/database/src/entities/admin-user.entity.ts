import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  FINANCE = 'finance',
  SUPPORT = 'support',
  OPERATIONS = 'operations',
  MARKETING = 'marketing',
  CONTENT = 'content',
  MODERATOR = 'moderator',
}

@Entity('admin_users')
@Index(['email'])
export class AdminUser extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: AdminRole })
  role: AdminRole;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;
}
