import { INestApplication } from '@nestjs/common';
import { TravelType } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { createTestItinerary, createTestUser } from './test-data';

interface ItineraryListResponse {
  data: Array<{ id: string; destination: string }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

describe('Itinerary + Groups (e2e)', () => {
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

  it('/api/itinerary/generate (POST) streams and persists an itinerary', async () => {
    const payload = {
      destination: 'Paris, France',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T00:00:00.000Z',
      days: 2,
      travelType: TravelType.CULTURAL,
    };

    const response = await request(app.getHttpServer())
      .post('/api/itinerary/generate')
      .send(payload)
      .expect(200);

    expect(response.text).toContain('"type":"day"');
    expect(response.text).toContain('"type":"complete"');

    const itinerary = await prisma.itinerary.findFirst({
      where: { userId, destination: payload.destination },
    });

    expect(itinerary).toBeTruthy();
  });

  it('/api/itinerary (GET/PATCH/DELETE) supports itinerary editing', async () => {
    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Lisbon',
    });

    const listRes = await request(app.getHttpServer())
      .get('/api/itinerary')
      .expect(200);

    const listBody = listRes.body as ItineraryListResponse;
    const ids = listBody.data.map((item) => item.id);
    expect(ids).toContain(itinerary.id);

    await request(app.getHttpServer())
      .patch(`/api/itinerary/${itinerary.id}`)
      .send({ destination: 'Lisbon Updated' })
      .expect(200)
      .expect((res) => {
        expect(res.body.destination).toBe('Lisbon Updated');
      });

    await request(app.getHttpServer())
      .delete(`/api/itinerary/${itinerary.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('Itinerary deleted successfully');
      });
  });

  it('/api/groups (POST/GET) adds itineraries to a group', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Group ${Date.now()}` })
      .expect(201);

    const groupId = groupRes.body.id as string;

    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Berlin',
    });

    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries`)
      .send({ itineraryId: itinerary.id })
      .expect(201)
      .expect((res) => {
        expect(res.body.itinerary.id).toBe(itinerary.id);
      });

    await request(app.getHttpServer())
      .get(`/api/groups/${groupId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.itineraries.length).toBe(1);
      });
  });
});
