import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, TestAppContext } from './test-app';
import { createTestItinerary, createTestUser } from './test-data';
import { ActivityType } from '@prisma/client';

describe('Export Controller (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let testAppCtx: TestAppContext;

  beforeAll(async () => {
    testAppCtx = await createTestApp();
    app = testAppCtx.app;
    prisma = testAppCtx.prisma;

    const user = await createTestUser(prisma);
    userId = user.id;
    testAppCtx.setCurrentUser({ sub: user.id, email: user.email });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/export/:id/ics (GET) exports private itinerary to a valid .ics calendar file', async () => {
    // 1. Create a test itinerary
    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Rome, Italy',
    });

    // 2. Add an ItineraryDay and ItineraryActivity so there's actual events to map
    const day = await prisma.itineraryDay.create({
      data: {
        itineraryId: itinerary.id,
        dayNumber: 1,
        date: new Date('2026-06-01T00:00:00.000Z'),
        theme: 'Historical Rome',
      },
    });

    await prisma.itineraryActivity.create({
      data: {
        dayId: day.id,
        title: 'Colosseum Guided Tour',
        sortOrder: 1,
        activityType: ActivityType.ATTRACTION,
        startTime: '10:00',
        durationMinutes: 180,
        location: 'Colosseum, Piazza del Colosseo',
        description: 'Explore the ancient gladiatorial arena.',
      },
    });

    // 3. Trigger private export endpoint
    const response = await request(app.getHttpServer())
      .get(`/api/export/${itinerary.id}/ics`)
      .expect(200);

    // 4. Assert headers
    expect(response.headers['content-type']).toBe('text/calendar');
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="routiq-itinerary-${itinerary.id}.ics"`,
    );

    // 5. Assert calendar content body has standard ICS structure
    const bodyText = response.text;
    expect(bodyText).toContain('BEGIN:VCALENDAR');
    expect(bodyText).toContain('VERSION:2.0');
    expect(bodyText).toContain('BEGIN:VEVENT');
    expect(bodyText).toContain('SUMMARY:Colosseum Guided Tour');
    // Note: Comma is escaped inside RFC ics structures
    expect(bodyText).toContain('LOCATION:Colosseum\\, Piazza del Colosseo');
    expect(bodyText).toContain('DESCRIPTION:Explore the ancient gladiatorial arena.');
    expect(bodyText).toContain('END:VEVENT');
    expect(bodyText).toContain('END:VCALENDAR');
  });

  it('/api/export/shared/:id/ics (GET) exports shared/public itinerary without auth', async () => {
    // 1. Create an itinerary
    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Ljubljana, Slovenia',
    });

    const day = await prisma.itineraryDay.create({
      data: {
        itineraryId: itinerary.id,
        dayNumber: 1,
        date: new Date('2026-06-02T00:00:00.000Z'),
        theme: 'Slovenian Charm',
      },
    });

    await prisma.itineraryActivity.create({
      data: {
        dayId: day.id,
        title: 'Ljubljana Castle Walk',
        sortOrder: 1,
        activityType: ActivityType.ATTRACTION,
      },
    });

    // 2. Call the public shared export endpoint
    const response = await request(app.getHttpServer())
      .get(`/api/export/shared/${itinerary.id}/ics`)
      .expect(200);

    // 3. Assert headers and content
    expect(response.headers['content-type']).toBe('text/calendar');
    expect(response.text).toContain('BEGIN:VCALENDAR');
    expect(response.text).toContain('SUMMARY:Ljubljana Castle Walk');
  });
});
