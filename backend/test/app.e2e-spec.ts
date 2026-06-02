import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { createTestUser } from './test-data';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    const user = await createTestUser(prisma);
    testApp.setCurrentUser({ sub: user.id, email: user.email });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET) returns health status', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('healthy');
      });
  });

  it('/api/users/profile (GET) returns the current user', () => {
    return request(app.getHttpServer())
      .get('/api/users/profile')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.email).toBeDefined();
      });
  });

  it('/api/users/profile (PATCH) updates profile fields', () => {
    return request(app.getHttpServer())
      .patch('/api/users/profile')
      .send({
        name: 'Updated Name',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Name');
      });
  });
});
