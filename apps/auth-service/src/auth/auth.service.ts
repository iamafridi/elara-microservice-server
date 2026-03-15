import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, Session } from '../../../../libs/database/src/entities';
import { UserRole, UserStatus } from '../../../../libs/database/src/entities/user.entity';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private jwtService: JwtService,
    private eventPublisher: EventPublisher,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existing) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await argon2.hash(dto.password);
    }

    // Generate referral code
    const referralCode = this.generateReferralCode();

    // Create user
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role || UserRole.USER,
      referralCode,
      phoneVerified: false,
      emailVerified: false,
    });

    await this.userRepository.save(user);

    // Publish event
    await this.eventPublisher.publish('user.registered', {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    return {
      userId: user.id,
      message: 'User registered successfully. Please verify your phone number.',
    };
  }

  async login(dto: LoginDto) {
    // Find user by phone or email
    const user = await this.userRepository.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user account is not blocked
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Account has been blocked');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, dto.deviceId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    // OTP verification will be handled by OtpService
    // For now, we'll implement a simplified version

    // In production, this would verify the OTP from the database
    // and mark the user's phone/email as verified

    const user = await this.userRepository.findOne({
      where: [{ email: dto.identifier }, { phone: dto.identifier }],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update verification status
    if (dto.identifier.includes('@')) {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }

    await this.userRepository.save(user);

    // Publish event
    await this.eventPublisher.publish('user.verified', {
      userId: user.id,
      identifier: dto.identifier,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, dto.deviceId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(dto.refreshToken);

      // Find session
      const session = await this.sessionRepository.findOne({
        where: { refreshToken: dto.refreshToken },
        relations: ['user'],
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.sessionRepository.remove(session);
        throw new UnauthorizedException('Session expired');
      }

      // Generate new access token
      const accessToken = this.jwtService.sign({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, deviceId?: string) {
    const query = this.sessionRepository.createQueryBuilder().delete();

    if (deviceId) {
      query.where('userId = :userId AND deviceId = :deviceId', { userId, deviceId });
    } else {
      query.where('userId = :userId', { userId });
    }

    await query.execute();

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User, deviceId?: string) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
      },
    );

    // Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const session = this.sessionRepository.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      deviceId,
      expiresAt,
    });

    await this.sessionRepository.save(session);

    return { accessToken, refreshToken };
  }

  private generateReferralCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
