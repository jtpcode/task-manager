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
import { MatterResponse } from '../src/matters/interfaces/matter-response.interface';
import { clearDatabase } from './utils/db';

const TEST_USER_EMAIL = 'test-matters@example.com';
const TEST_USER_PASSWORD = 'password123';
const OTHER_USER_EMAIL = 'test-matters-other@example.com';
const OTHER_USER_PASSWORD = 'password456';

describe('Matters (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authToken: string;

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
});
