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

  it('prevents removing the last owner of a group', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Owner Guard ${Date.now()}` })
      .expect(201);

    const groupId = groupRes.body.data.id as string;

    const removeRes = await request(app.getHttpServer())
      .delete(`/api/groups/${groupId}/members/${userId}`)
      .expect(400);

    expect(removeRes.body.success).toBe(false);
  });

  it('prevents demoting the last owner of a group', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Owner Demotion ${Date.now()}` })
      .expect(201);

    const groupId = groupRes.body.data.id as string;

    const demoteRes = await request(app.getHttpServer())
      .patch(`/api/groups/${groupId}/members/${userId}/role`)
      .send({ role: 'MEMBER' })
      .expect(400);

    expect(demoteRes.body.success).toBe(false);
  });

  it('prevents double voting from creating duplicate votes', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Vote Guard ${Date.now()}` })
      .expect(201);

    const groupId = groupRes.body.data.id as string;
    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Vote City',
    });

    const addItineraryRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries`)
      .send({ itineraryId: itinerary.id })
      .expect(201);

    const groupItineraryId = addItineraryRes.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries/${groupItineraryId}/vote`)
      .send({ voteType: 'UPVOTE' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries/${groupItineraryId}/vote`)
      .send({ voteType: 'UPVOTE' })
      .expect(201);

    const votesRes = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/itineraries/${groupItineraryId}/votes`)
      .expect(200);

    expect(votesRes.body.success).toBe(true);
    expect(votesRes.body.data).toHaveLength(1);
  });
});
