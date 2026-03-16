import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpType, OtpPurpose } from '../../../../libs/database/src/entities/otp.entity';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private eventPublisher: EventPublisher,
  ) {}

  async generateOtp(identifier: string): Promise<string> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate any existing OTPs for this identifier
    await this.otpRepository.update(
      { identifier, verified: false },
      { verified: true }, // Mark as used to prevent reuse
    );

    const type = identifier.includes('@') ? OtpType.EMAIL : OtpType.PHONE;
    const purpose = OtpPurpose.LOGIN;

    // Create new OTP
    const otp = this.otpRepository.create({
      identifier,
      type,
      purpose,
      code,
      expiresAt,
      verified: false,
    });

    await this.otpRepository.save(otp);

    // Publish event for SMS/Email sending
    await this.eventPublisher.publish('otp.generated', {
      identifier,
      code,
      expiresAt,
    });

    return code;
  }

  async verifyOtp(identifier: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        identifier,
        code,
        verified: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      return false;
    }

    // Check if OTP is expired
    if (otp.expiresAt < new Date()) {
      return false;
    }

    // Mark as verified
    otp.verified = true;
    await this.otpRepository.save(otp);

    return true;
  }

  async cleanupExpiredOtps() {
    // Delete OTPs older than 1 hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await this.otpRepository.delete({
      createdAt: LessThan(oneHourAgo),
    });
  }
}
