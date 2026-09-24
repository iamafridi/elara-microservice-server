import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ZoneModule } from './zone-module.entity';

export enum ZoneStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('zones')
@Index(['status'])
export class Zone extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  polygon: string;

  @Column({ type: 'enum', enum: ZoneStatus, default: ZoneStatus.ACTIVE })
  status: ZoneStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => ZoneModule, (zoneModule) => zoneModule.zone)
  modules: ZoneModule[];
}
