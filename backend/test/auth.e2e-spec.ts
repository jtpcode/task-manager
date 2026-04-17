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
import { clearDatabase } from './utils/db';

const TEST_USER_EMAIL = 'test-auth@example.com';
const TEST_USER_PASSWORD = 'password123';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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

    // Ensure clean state then create test user
    await clearDatabase(prisma);
    await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        password: await bcrypt.hash(TEST_USER_PASSWORD, 10),
      },
    });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('returns 200 with access_token on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const body = res.body as { access_token: string };
      expect(res.status).toBe(200);
      expect(body).toHaveProperty('access_token');
      expect(typeof body.access_token).toBe('string');
      expect(body.access_token.length).toBeGreaterThan(0);
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('returns 401 when user does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: TEST_USER_PASSWORD });

      expect(res.status).toBe(401);
    });

    it('returns 422 when body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(422);
    });

    it('returns 422 when email format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: TEST_USER_PASSWORD });

      expect(res.status).toBe(422);
    });

    it('returns 422 when password is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL });

      expect(res.status).toBe(422);
    });
  });

  describe('Protected routes', () => {
    it('returns 401 on a protected route without a token', async () => {
      const res = await request(app.getHttpServer()).get('/');

      expect(res.status).toBe(401);
    });

    it('returns 200 on a protected route with a valid token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const token = (loginRes.body as { access_token: string }).access_token;

      const res = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
