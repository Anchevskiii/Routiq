import { INestApplication } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { createTestUser } from './test-data';

describe('Group Invitations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerId: string;
  let inviteeId: string;
  let inviteeEmail: string;
  let setCurrentUser: (user: { sub: string; email: string }) => void;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    setCurrentUser = testApp.setCurrentUser;

    const owner = await createTestUser(prisma);
    const invitee = await createTestUser(prisma);
    ownerId = owner.id;
    inviteeId = invitee.id;
    inviteeEmail = invitee.email;
  });

  afterAll(async () => {
    await app.close();
  });

  it('invites and accepts a group invitation', async () => {
    setCurrentUser({ sub: ownerId, email: 'owner@example.com' });

    const groupRes = await request(app.getHttpServer())
      .post('/api/groups')
      .send({ name: `Invite Flow ${Date.now()}` })
      .expect(201);

    expect(groupRes.body.success).toBe(true);
    const groupId = groupRes.body.data.id as string;

    const inviteRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/invite`)
      .send({ email: inviteeEmail })
      .expect(201);

    expect(inviteRes.body.success).toBe(true);

    setCurrentUser({ sub: inviteeId, email: inviteeEmail });

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/accept`)
      .expect(200);

    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.status).toBe(InvitationStatus.ACCEPTED);

    const listRes = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    expect(listRes.body.success).toBe(true);
    const groupIds = (listRes.body.data as Array<{ id: string }>).map(
      (group) => group.id,
    );
    expect(groupIds).toContain(groupId);
  });
});
