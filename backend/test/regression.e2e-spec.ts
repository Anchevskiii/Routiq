import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { createTestItinerary, createTestUser } from './test-data';

describe('Regression (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    const user = await createTestUser(prisma);
    userId = user.id;
    testApp.setCurrentUser({ sub: user.id, email: user.email });
  });

  afterAll(async () => {
    await app.close();
  });

  it('prevents adding the same itinerary to a group twice', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Regression Group ${Date.now()}` })
      .expect(201);

    const groupId = groupRes.body.data.id as string;
    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Rome',
    });

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries`)
      .send({ itineraryId: itinerary.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries`)
      .send({ itineraryId: itinerary.id })
      .expect(400);
  });
});
