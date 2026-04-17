import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  MatterResponse,
  TimeEntryResponse,
} from '../src/matters/interfaces/matter-response.interface';
import { clearDatabase } from './utils/db';

const TEST_USER_EMAIL = 'test-matters@example.com';
const TEST_USER_PASSWORD = 'password123';
const OTHER_USER_EMAIL = 'test-matters-other@example.com';
const OTHER_USER_PASSWORD = 'password456';

describe('Matters (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authToken: string;
  let alphaMatterId: number;
  let betaMatterId: number;
  let otherMatterId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        exceptionFactory: (errors) => new UnprocessableEntityException(errors),
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    await clearDatabase(prisma);

    // Create primary test user with 2 matters
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        password: await bcrypt.hash(TEST_USER_PASSWORD, 10),
        matters: {
          create: [
            {
              title: 'Test Matter Alpha',
              clientName: 'Client Alpha',
              status: 'OPEN',
              timeEntries: {
                create: [
                  { description: 'Research', minutes: 60 },
                  { description: 'Drafting', minutes: 90 },
                ],
              },
            },
            {
              title: 'Test Matter Beta',
              clientName: 'Client Beta',
              status: 'CLOSED',
              timeEntries: {
                create: [{ description: 'Consultation', minutes: 30 }],
              },
            },
          ],
        },
      },
    });

    // Create a second user with their own matter (should not appear in primary user's results)
    await prisma.user.create({
      data: {
        email: OTHER_USER_EMAIL,
        password: await bcrypt.hash(OTHER_USER_PASSWORD, 10),
        matters: {
          create: [
            {
              title: 'Other User Matter',
              clientName: 'Other Client',
              status: 'OPEN',
            },
          ],
        },
      },
    });

    // Obtain a valid JWT for the primary test user
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

    authToken = (loginRes.body as { access_token: string }).access_token;

    const alphaM = await prisma.matter.findFirstOrThrow({
      where: { title: 'Test Matter Alpha', userId: user.id },
    });
    alphaMatterId = alphaM.id;

    const betaM = await prisma.matter.findFirstOrThrow({
      where: { title: 'Test Matter Beta', userId: user.id },
    });
    betaMatterId = betaM.id;

    const otherM = await prisma.matter.findFirstOrThrow({
      where: { title: 'Other User Matter' },
    });
    otherMatterId = otherM.id;

    expect(user).toBeDefined();
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /matters', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get('/matters');
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('returns 200 with an array of matters for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const matters = res.body as MatterResponse[];
      expect(matters).toHaveLength(2);
    });

    it('returns matters with the correct fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', `Bearer ${authToken}`);

      const matters = res.body as MatterResponse[];
      for (const matter of matters) {
        expect(matter).toHaveProperty('id');
        expect(matter).toHaveProperty('title');
        expect(matter).toHaveProperty('clientName');
        expect(matter).toHaveProperty('status');
        expect(matter).toHaveProperty('totalMinutes');
        expect(matter).toHaveProperty('createdAt');
        expect(matter).toHaveProperty('updatedAt');
        expect(['OPEN', 'CLOSED']).toContain(matter.status);
        expect(typeof matter.totalMinutes).toBe('number');
      }
    });

    it('computes totalMinutes correctly from time entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', `Bearer ${authToken}`);

      const matters = res.body as MatterResponse[];
      // Ordered by createdAt desc — Beta was created second, so it comes first
      const beta = matters.find((m) => m.title === 'Test Matter Beta');
      const alpha = matters.find((m) => m.title === 'Test Matter Alpha');

      expect(beta).toBeDefined();
      expect(alpha).toBeDefined();
      expect(beta!.totalMinutes).toBe(30);
      expect(alpha!.totalMinutes).toBe(150); // 60 + 90
    });

    it('does not return matters belonging to other users', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', `Bearer ${authToken}`);

      const matters = res.body as MatterResponse[];
      const titles = matters.map((m) => m.title);
      expect(titles).not.toContain('Other User Matter');
    });
  });

  describe('POST /matters', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .send({ title: 'New Matter', clientName: 'New Client' });
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', 'Bearer invalidtoken')
        .send({ title: 'New Matter', clientName: 'New Client' });
      expect(res.status).toBe(401);
    });

    it('returns 422 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clientName: 'New Client' });
      expect(res.status).toBe(422);
    });

    it('returns 422 when clientName is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Matter' });
      expect(res.status).toBe(422);
    });

    it('returns 422 when title is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '', clientName: 'New Client' });
      expect(res.status).toBe(422);
    });

    it('creates a matter with default OPEN status and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Created Matter', clientName: 'Created Client' });

      expect(res.status).toBe(201);

      const matter = res.body as MatterResponse;
      expect(matter.title).toBe('Created Matter');
      expect(matter.clientName).toBe('Created Client');
      expect(matter.status).toBe('OPEN');
      expect(matter.totalMinutes).toBe(0);
      expect(matter).toHaveProperty('id');
      expect(matter).toHaveProperty('createdAt');
      expect(matter).toHaveProperty('updatedAt');
    });

    it('creates a matter with explicit CLOSED status', async () => {
      const res = await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Closed Matter',
          clientName: 'Closed Client',
          status: 'CLOSED',
        });

      expect(res.status).toBe(201);
      expect((res.body as MatterResponse).status).toBe('CLOSED');
    });

    it('does not create matters for other users', async () => {
      await request(app.getHttpServer())
        .post('/matters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Isolated Matter', clientName: 'Isolated Client' });

      // Verify it appears in the creating user's list
      const listRes = await request(app.getHttpServer())
        .get('/matters')
        .set('Authorization', `Bearer ${authToken}`);

      const titles = (listRes.body as MatterResponse[]).map((m) => m.title);
      expect(titles).toContain('Isolated Matter');
    });
  });

  describe('GET /matters/:id/time-entries', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get(
        `/matters/${alphaMatterId}/time-entries`,
      );
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${alphaMatterId}/time-entries`)
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent matter id', async () => {
      const res = await request(app.getHttpServer())
        .get('/matters/999999/time-entries')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 for a matter belonging to another user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${otherMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    it('returns 200 with an array of time entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${alphaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns the correct number of entries for each matter', async () => {
      const alphaRes = await request(app.getHttpServer())
        .get(`/matters/${alphaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);
      expect((alphaRes.body as TimeEntryResponse[]).length).toBe(2);

      const betaRes = await request(app.getHttpServer())
        .get(`/matters/${betaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);
      expect((betaRes.body as TimeEntryResponse[]).length).toBe(1);
    });

    it('returns time entries with the correct fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${alphaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);

      const entries = res.body as TimeEntryResponse[];
      for (const entry of entries) {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('minutes');
        expect(entry).toHaveProperty('matterId');
        expect(entry).toHaveProperty('createdAt');
        expect(entry).toHaveProperty('updatedAt');
        expect(typeof entry.minutes).toBe('number');
        expect(entry.matterId).toBe(alphaMatterId);
      }
    });

    it('returns correct minutes values for Alpha matter entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${alphaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);

      const entries = res.body as TimeEntryResponse[];
      const minuteValues = entries.map((e) => e.minutes).sort((a, b) => a - b);
      expect(minuteValues).toEqual([60, 90]);
    });

    it('returns correct minutes value for Beta matter entry', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matters/${betaMatterId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`);

      const entries = res.body as TimeEntryResponse[];
      expect(entries[0].minutes).toBe(30);
    });
  });
});
