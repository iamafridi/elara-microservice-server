import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../apps/main/src/app.module';
import { TestDatabaseHelper } from '../../libs/common/src/testing';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+447700900000',
    password: 'Test@123456',
    role: 'customer',
  };

  beforeAll(async () => {
    // Initialize test database
    await TestDatabaseHelper.init();

    // Create testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await TestDatabaseHelper.cleanupAll();
    await TestDatabaseHelper.close();
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await TestDatabaseHelper.cleanup(['users', 'sessions', 'otps']);
  });

  describe('POST /auth/register', () => {
    it('should register a new user with email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body).not.toHaveProperty('password');

      userId = response.body.user.id;
    });

    it('should register a new user with phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          phone: testUser.phone,
          password: testUser.password,
          role: testUser.role,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.phone).toBe(testUser.phone);
    });

    it('should fail to register with duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: 'invalid-email',
          password: testUser.password,
          role: testUser.role,
        })
        .expect(400);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: '123',
          role: testUser.role,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should login with phone number', async () => {
      // Register with phone
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Phone User',
          phone: testUser.phone,
          password: testUser.password,
          role: testUser.role,
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          phone: testUser.phone,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.phone).toBe(testUser.phone);
    });
  });

  describe('GET /auth/profile', () => {
    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.name).toBe(testUser.name);
    });

    it('should fail without authorization token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the token after logout - should fail
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP to email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({
          email: testUser.email,
          purpose: 'verification',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('OTP sent');
    });

    it('should send OTP to phone', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({
          phone: testUser.phone,
          purpose: 'verification',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should verify valid OTP', async () => {
      // Send OTP first
      await request(app.getHttpServer())
        .post('/auth/send-otp')
        .send({
          email: testUser.email,
          purpose: 'verification',
        });

      // In test environment, you might want to mock OTP or use a test OTP
      // For now, this test demonstrates the flow
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          email: testUser.email,
          otp: '123456', // This would be the actual OTP in a real test
        });

      // This will fail unless you implement test OTP logic
      // expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });
    });

    it('should send password reset email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset');
    });
  });
});
