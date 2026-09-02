import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum OtpType {
  PHONE = 'phone',
  EMAIL = 'email',
}

export enum OtpPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
}

@Entity('otps')
@Index(['identifier', 'code'])
@Index(['expiresAt'])
export class Otp extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  identifier: string;

  @Column({ type: 'enum', enum: OtpType })
  type: OtpType;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
