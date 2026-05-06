import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from './../src/app.module';

// Test-specific response interface with parsed body
interface TestResponse {
  body: {
    success: boolean;
    data: Record<string, unknown>;
    [key: string]: unknown;
  };
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(cookieParser());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET) - should return health status', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res: TestResponse) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      });
  });
});

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(cookieParser());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `test-${timestamp}@example.com`,
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        })
        .expect(400)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should authenticate existing user', async () => {
      // First register a user
      const timestamp = Date.now();
      const email = `login-test-${timestamp}@example.com`;
      const password = 'password123';

      await request(app.getHttpServer()).post('/api/auth/register').send({
        email,
        password,
        name: 'Login Test User',
      });

      // Then login
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password,
        })
        .expect(200)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user).toBeDefined();
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(false);
        });
    });
  });
});

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(cookieParser());
    app.setGlobalPrefix('api');

    await app.init();

    // Register and login a test user
    const timestamp = Date.now();
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `user-test-${timestamp}@example.com`,
        password: 'password123',
        name: 'User Test',
      });

    authToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/users/profile (GET)', () => {
    it('should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(userId);
        });
    });

    it('should reject request without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('/api/users/profile (PATCH)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200)
        .expect((res: TestResponse) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Name');
        });
    });
  });
});
