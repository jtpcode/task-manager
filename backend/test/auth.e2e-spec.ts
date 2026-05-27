import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { clearDatabase } from './utils/db';

/** Extract the raw `name=value` part of a Set-Cookie header for use in subsequent requests. */
const extractCookie = (
  res: { headers: Record<string, unknown> },
  name: string,
): string => {
  const header = res.headers['set-cookie'] as string[] | undefined;
  return header?.find((c) => c.startsWith(`${name}=`))?.split(';')[0] ?? '';
};

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
    app.use(cookieParser());
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
    it('returns 200 with email in body and HttpOnly cookie on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const body = res.body as { email: string };
      expect(res.status).toBe(200);
      expect(body.email).toBe(TEST_USER_EMAIL);

      const cookie = extractCookie(res, 'access_token');
      expect(cookie).toMatch(/^access_token=/);
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('HttpOnly')]),
      );
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
    it('returns 401 on a protected route without a cookie', async () => {
      const res = await request(app.getHttpServer()).get('/tasks');

      expect(res.status).toBe(401);
    });

    it('returns 200 on a protected route with a valid cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const cookie = extractCookie(loginRes, 'access_token');

      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 200 with email when cookie is set', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const cookie = extractCookie(loginRes, 'access_token');

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect((res.body as { email: string }).email).toBe(TEST_USER_EMAIL);
    });

    it('returns 401 when no cookie is sent', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 and clears the cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      const cookie = extractCookie(loginRes, 'access_token');

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(204);

      // Cookie should be cleared (Max-Age=0 or Expires in the past)
      const clearedCookie = (logoutRes.headers['set-cookie'] as unknown as string[] | undefined)
        ?.find((c) => c.startsWith('access_token='));
      expect(clearedCookie).toBeDefined();
      expect(clearedCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    });
  });

  describe('POST /auth/register', () => {
    const REGISTER_EMAIL = 'register-test@example.com';
    const REGISTER_PASSWORD = 'securepass';

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: REGISTER_EMAIL } });
    });

    it('returns 201 with email in body and HttpOnly cookie on valid registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: REGISTER_EMAIL, password: REGISTER_PASSWORD });

      const body = res.body as { email: string };
      expect(res.status).toBe(201);
      expect(body.email).toBe(REGISTER_EMAIL);

      const cookie = extractCookie(res, 'access_token');
      expect(cookie).toMatch(/^access_token=/);
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('HttpOnly')]),
      );
    });

    it('returns 409 when email is already registered', async () => {
      await prisma.user.create({
        data: {
          email: REGISTER_EMAIL,
          password: await bcrypt.hash(REGISTER_PASSWORD, 10),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: REGISTER_EMAIL, password: REGISTER_PASSWORD });

      expect(res.status).toBe(409);
    });

    it('returns 422 when body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({});

      expect(res.status).toBe(422);
    });

    it('returns 422 when email format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: REGISTER_PASSWORD });

      expect(res.status).toBe(422);
    });

    it('returns 422 when password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: REGISTER_EMAIL, password: 'short' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when password is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: REGISTER_EMAIL });

      expect(res.status).toBe(422);
    });
  });
});
