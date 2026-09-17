import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TaskerProfile } from './tasker-profile.entity';

export enum PortfolioFileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('tasker_portfolio')
@Index(['taskerId'])
export class TaskerPortfolio extends BaseEntity {
  @Column({ type: 'uuid' })
  taskerId: string;

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ type: 'enum', enum: PortfolioFileType })
  fileType: PortfolioFileType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => TaskerProfile, (tasker) => tasker.portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskerId' })
  tasker: TaskerProfile;
}
