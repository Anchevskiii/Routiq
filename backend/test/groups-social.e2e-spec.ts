import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { createTestItinerary, createTestUser } from './test-data';

describe('Groups Social (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let userEmail: string;
  let setCurrentUser: (user: { sub: string; email: string }) => void;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    setCurrentUser = testApp.setCurrentUser;

    const user = await createTestUser(prisma);
    userId = user.id;
    userEmail = user.email;
    setCurrentUser({ sub: userId, email: userEmail });
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports voting, threaded comments, and reactions in group details', async () => {
    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Social Group ${Date.now()}` })
      .expect(201);

    expect(groupRes.body.success).toBe(true);
    const groupId = groupRes.body.data.id as string;

    const itinerary = await createTestItinerary(prisma, userId, {
      destination: 'Social City',
    });

    const addItineraryRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries`)
      .send({ itineraryId: itinerary.id })
      .expect(201);

    expect(addItineraryRes.body.success).toBe(true);
    const groupItineraryId = addItineraryRes.body.data.id as string;

    const commentRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/comments`)
      .send({ content: 'Top level comment' })
      .expect(201);

    expect(commentRes.body.success).toBe(true);
    const commentId = commentRes.body.data.id as string;

    const replyRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/comments`)
      .send({ content: 'Reply comment', parentId: commentId })
      .expect(201);

    expect(replyRes.body.success).toBe(true);

    const reactionRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/comments/${commentId}/reactions`)
      .send({ emoji: '👍' })
      .expect(200);

    expect(reactionRes.body.success).toBe(true);

    const voteRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/itineraries/${groupItineraryId}/vote`)
      .send({ voteType: 'UPVOTE' })
      .expect(201);

    expect(voteRes.body.success).toBe(true);

    const detailsRes = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}`)
      .expect(200);

    expect(detailsRes.body.success).toBe(true);

    const group = detailsRes.body.data as {
      comments: Array<{
        id: string;
        replies: Array<{ id: string }>;
        reactions: Array<{ emoji: string; userId: string }>;
      }>;
      itineraries: Array<{
        votes: Array<{ userId: string; voteType: string }>;
      }>;
    };

    expect(group.comments.length).toBe(1);
    expect(group.comments[0].replies.length).toBe(1);
    expect(group.comments[0].reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ emoji: ':thumbs_up:', userId }),
      ]),
    );

    expect(group.itineraries.length).toBe(1);
    expect(group.itineraries[0].votes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId, voteType: 'UPVOTE' }),
      ]),
    );
  });
});
