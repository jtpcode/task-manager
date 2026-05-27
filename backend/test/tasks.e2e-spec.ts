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
import {
  TaskResponse,
  TaskEntryResponse,
} from '../src/tasks/interfaces/task-response.interface';
import { clearDatabase } from './utils/db';

const TEST_USER_EMAIL = 'test-tasks@example.com';
const TEST_USER_PASSWORD = 'password123';
const OTHER_USER_EMAIL = 'test-tasks-other@example.com';
const OTHER_USER_PASSWORD = 'password456';

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authCookie: string;
  let alphaTaskId: number;
  let betaTaskId: number;
  let otherTaskId: number;

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

    await clearDatabase(prisma);

    // Create primary test user with 2 tasks
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        password: await bcrypt.hash(TEST_USER_PASSWORD, 10),
        tasks: {
          create: [
            {
              title: 'Test Task Alpha',
              status: 'OPEN',
              taskEntries: {
                create: [
                  { description: 'Research', minutes: 60 },
                  { description: 'Drafting', minutes: 90 },
                ],
              },
            },
            {
              title: 'Test Task Beta',
              status: 'CLOSED',
              taskEntries: {
                create: [{ description: 'Consultation', minutes: 30 }],
              },
            },
          ],
        },
      },
    });

    // Create a second user with their own task (should not appear in primary user's results)
    await prisma.user.create({
      data: {
        email: OTHER_USER_EMAIL,
        password: await bcrypt.hash(OTHER_USER_PASSWORD, 10),
        tasks: {
          create: [
            {
              title: 'Other User Task',
              status: 'OPEN',
            },
          ],
        },
      },
    });

    // Obtain a valid auth cookie for the primary test user
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

    const setCookie = loginRes.headers['set-cookie'] as unknown as string[] | undefined;
    authCookie = setCookie?.find((c) => c.startsWith('access_token='))?.split(';')[0] ?? '';

    const alphaT = await prisma.task.findFirstOrThrow({
      where: { title: 'Test Task Alpha', userId: user.id },
    });
    alphaTaskId = alphaT.id;

    const betaT = await prisma.task.findFirstOrThrow({
      where: { title: 'Test Task Beta', userId: user.id },
    });
    betaTaskId = betaT.id;

    const otherT = await prisma.task.findFirstOrThrow({
      where: { title: 'Other User Task' },
    });
    otherTaskId = otherT.id;

    expect(user).toBeDefined();
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /tasks', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get('/tasks');
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', 'access_token=invalidtoken');
      expect(res.status).toBe(401);
    });

    it('returns 200 with an array of tasks for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const tasks = res.body as TaskResponse[];
      expect(tasks).toHaveLength(2);
    });

    it('returns tasks with the correct fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', authCookie);

      const tasks = res.body as TaskResponse[];
      for (const task of tasks) {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('totalMinutes');
        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');
        expect(['OPEN', 'CLOSED']).toContain(task.status);
        expect(typeof task.totalMinutes).toBe('number');
      }
    });

    it('computes totalMinutes correctly from task entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', authCookie);

      const tasks = res.body as TaskResponse[];
      // Ordered by createdAt desc — Beta was created second, so it comes first
      const beta = tasks.find((t) => t.title === 'Test Task Beta');
      const alpha = tasks.find((t) => t.title === 'Test Task Alpha');

      expect(beta).toBeDefined();
      expect(alpha).toBeDefined();
      expect(beta!.totalMinutes).toBe(30);
      expect(alpha!.totalMinutes).toBe(150); // 60 + 90
    });

    it('does not return tasks belonging to other users', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', authCookie);

      const tasks = res.body as TaskResponse[];
      const titles = tasks.map((t) => t.title);
      expect(titles).not.toContain('Other User Task');
    });
  });

  describe('POST /tasks', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'New Task' });
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', 'access_token=invalidtoken')
        .send({ title: 'New Task' });
      expect(res.status).toBe(401);
    });

    it('returns 422 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({});
      expect(res.status).toBe(422);
    });

    it('returns 422 when title is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({ title: '' });
      expect(res.status).toBe(422);
    });

    it('creates a task with default OPEN status and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({ title: 'Created Task' });

      expect(res.status).toBe(201);

      const task = res.body as TaskResponse;
      expect(task.title).toBe('Created Task');
      expect(task.status).toBe('OPEN');
      expect(task.totalMinutes).toBe(0);
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
    });

    it('creates a task with explicit CLOSED status', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({
          title: 'Closed Task',
          status: 'CLOSED',
        });

      expect(res.status).toBe(201);
      expect((res.body as TaskResponse).status).toBe('CLOSED');
    });

    it('does not create tasks for other users', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({ title: 'Isolated Task' });

      // Verify it appears in the creating user's list
      const listRes = await request(app.getHttpServer())
        .get('/tasks')
        .set('Cookie', authCookie);

      const titles = (listRes.body as TaskResponse[]).map((t) => t.title);
      expect(titles).toContain('Isolated Task');
    });
  });

  describe('GET /tasks/:id/task-entries', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get(
        `/tasks/${alphaTaskId}/task-entries`,
      );
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', 'access_token=invalidtoken');
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent task id', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks/999999/task-entries')
        .set('Cookie', authCookie);
      expect(res.status).toBe(404);
    });

    it('returns 404 for a task belonging to another user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${otherTaskId}/task-entries`)
        .set('Cookie', authCookie);
      expect(res.status).toBe(404);
    });

    it('returns 200 with an array of task entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns the correct number of entries for each task', async () => {
      const alphaRes = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie);
      expect((alphaRes.body as TaskEntryResponse[]).length).toBe(2);

      const betaRes = await request(app.getHttpServer())
        .get(`/tasks/${betaTaskId}/task-entries`)
        .set('Cookie', authCookie);
      expect((betaRes.body as TaskEntryResponse[]).length).toBe(1);
    });

    it('returns task entries with the correct fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie);

      const entries = res.body as TaskEntryResponse[];
      for (const entry of entries) {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('minutes');
        expect(entry).toHaveProperty('taskId');
        expect(entry).toHaveProperty('createdAt');
        expect(entry).toHaveProperty('updatedAt');
        expect(typeof entry.minutes).toBe('number');
        expect(entry.taskId).toBe(alphaTaskId);
      }
    });

    it('returns correct minutes values for Alpha task entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie);

      const entries = res.body as TaskEntryResponse[];
      const minuteValues = entries.map((e) => e.minutes).sort((a, b) => a - b);
      expect(minuteValues).toEqual([60, 90]);
    });

    it('returns correct minutes value for Beta task entry', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${betaTaskId}/task-entries`)
        .set('Cookie', authCookie);

      const entries = res.body as TaskEntryResponse[];
      expect(entries[0].minutes).toBe(30);
    });
  });

  describe('POST /tasks/:id/task-entries', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .send({ description: 'Work', minutes: 30 });
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', 'access_token=invalidtoken')
        .send({ description: 'Work', minutes: 30 });
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent task id', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks/999999/task-entries')
        .set('Cookie', authCookie)
        .send({ description: 'Work', minutes: 30 });
      expect(res.status).toBe(404);
    });

    it('returns 404 for a task belonging to another user', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${otherTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Work', minutes: 30 });
      expect(res.status).toBe(404);
    });

    it('returns 422 when description is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ minutes: 30 });
      expect(res.status).toBe(422);
    });

    it('returns 422 when minutes is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Work' });
      expect(res.status).toBe(422);
    });

    it('returns 422 when minutes is 0', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Work', minutes: 0 });
      expect(res.status).toBe(422);
    });

    it('returns 422 when minutes is negative', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Work', minutes: -10 });
      expect(res.status).toBe(422);
    });

    it('creates a task entry with an explicit date and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${betaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Review', minutes: 45, date: '2026-01-15' });

      expect(res.status).toBe(201);
      const entry = res.body as TaskEntryResponse;
      expect(entry.description).toBe('Review');
      expect(entry.minutes).toBe(45);
      expect(entry.taskId).toBe(betaTaskId);
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('createdAt');
      expect(entry).toHaveProperty('updatedAt');
    });

    it('creates a task entry without a date (defaults to now) and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tasks/${betaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Filing', minutes: 20 });

      expect(res.status).toBe(201);
      const entry = res.body as TaskEntryResponse;
      expect(entry.description).toBe('Filing');
      expect(entry.minutes).toBe(20);
      expect(entry).toHaveProperty('date');
    });

    it('new entry appears in subsequent GET /tasks/:id/task-entries', async () => {
      await request(app.getHttpServer())
        .post(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie)
        .send({ description: 'Verification entry', minutes: 15 });

      const listRes = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/task-entries`)
        .set('Cookie', authCookie);

      const entries = listRes.body as TaskEntryResponse[];
      expect(entries.some((e) => e.description === 'Verification entry')).toBe(
        true,
      );
    });
  });

  describe('GET /tasks/:id/summary', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get(
        `/tasks/${alphaTaskId}/summary`,
      );
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/summary`)
        .set('Cookie', 'access_token=invalidtoken');
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent task id', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks/999999/summary')
        .set('Cookie', authCookie);
      expect(res.status).toBe(404);
    });

    it('returns 404 for a task belonging to another user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${otherTaskId}/summary`)
        .set('Cookie', authCookie);
      expect(res.status).toBe(404);
    });

    it('returns 503 when GOOGLE_AI_API_KEY is not set', async () => {
      const original = process.env['GOOGLE_AI_API_KEY'];
      delete process.env['GOOGLE_AI_API_KEY'];

      const res = await request(app.getHttpServer())
        .get(`/tasks/${alphaTaskId}/summary`)
        .set('Cookie', authCookie);

      process.env['GOOGLE_AI_API_KEY'] = original;
      expect(res.status).toBe(503);
    });

    it('returns 400 when the task has no task entries', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Cookie', authCookie)
        .send({ title: 'Empty Task' });
      const emptyTaskId = (createRes.body as TaskResponse).id;

      const res = await request(app.getHttpServer())
        .get(`/tasks/${emptyTaskId}/summary`)
        .set('Cookie', authCookie);
      expect(res.status).toBe(400);
    });
  });
});
