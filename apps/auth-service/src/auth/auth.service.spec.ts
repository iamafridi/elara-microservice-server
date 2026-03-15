import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User, Session } from '../../../../libs/database/src/entities';
import { UserRole } from '../../../../libs/database/src/entities/user.entity';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';
import { createMockRepository, createTestUser } from '../../../../libs/common/src/testing';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let sessionRepository: any;
  let jwtService: JwtService;
  let eventPublisher: EventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: createMockRepository<User>(),
        },
        {
          provide: 'SessionRepository',
          useValue: createMockRepository<Session>(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            signAsync: jest.fn(),
            verify: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: EventPublisher,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get('UserRepository');
    sessionRepository = module.get('SessionRepository');
    jwtService = module.get<JwtService>(JwtService);
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+447000123456',
      password: 'Password123!',
      role: UserRole.USER,
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed_password';
      const testUser = createTestUser({
        name: registerDto.name,
        email: registerDto.email,
        phone: registerDto.phone,
      });

      userRepository.findOne.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.create.mockReturnValue(testUser);
      userRepository.save.mockResolvedValue(testUser);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { phone: registerDto.phone }],
      });
      expect(argon2.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalledWith('user.registered', expect.any(Object));
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('message');
    });

    it('should throw ConflictException if user with email already exists', async () => {
      const existingUser = createTestUser({ email: registerDto.email });
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { phone: registerDto.phone }],
      });
    });

    it('should throw ConflictException if user with phone already exists', async () => {
      const existingUser = createTestUser({ phone: registerDto.phone });
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should allow registration without password for social login', async () => {
      const socialRegisterDto = {
        ...registerDto,
        password: undefined,
      };

      const testUser = createTestUser({ passwordHash: null });
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(testUser);
      userRepository.save.mockResolvedValue(testUser);

      const result = await service.register(socialRegisterDto);

      expect(argon2.hash).not.toHaveBeenCalled();
      expect(result).toHaveProperty('userId');
    });
  });

  describe('login', () => {
    const loginDto = {
      identifier: 'test@example.com',
      password: 'Password123!',
      deviceId: 'device_123',
    };

    it('should successfully login with valid credentials', async () => {
      const user = createTestUser({
        email: loginDto.identifier,
        passwordHash: 'hashed_password',
        status: 'active',
      });

      userRepository.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      sessionRepository.create.mockReturnValue({});
      sessionRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: loginDto.identifier }, { phone: loginDto.identifier }],
      });
      expect(argon2.verify).toHaveBeenCalledWith(user.passwordHash, loginDto.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(user.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const user = createTestUser({
        email: loginDto.identifier,
        passwordHash: 'hashed_password',
      });

      userRepository.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(argon2.verify).toHaveBeenCalledWith(user.passwordHash, loginDto.password);
    });

    it('should throw UnauthorizedException if user account is not active', async () => {
      const user = createTestUser({
        email: loginDto.identifier,
        passwordHash: 'hashed_password',
        status: 'inactive',
      });

      userRepository.findOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no password (social login only)', async () => {
      const user = createTestUser({
        email: loginDto.identifier,
        passwordHash: null,
      });

      userRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateReferralCode', () => {
    it('should generate a unique referral code', () => {
      const referralCode1 = (service as any).generateReferralCode();
      const referralCode2 = (service as any).generateReferralCode();

      expect(referralCode1).toBeDefined();
      expect(referralCode1).toHaveLength(8);
      expect(referralCode1).toMatch(/^[A-Z0-9]{8}$/);
      expect(referralCode1).not.toBe(referralCode2);
    });
  });

  describe('edge cases', () => {
    it('should handle database errors gracefully during registration', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+447000123456',
        password: 'Password123!',
      };

      userRepository.findOne.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      userRepository.create.mockReturnValue(createTestUser());
      userRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow('Database error');
    });
  });
});
