import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    console.log('Database already seeded, skipping.');
    return;
  }

  // 1. Create a Seed User
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: '$2b$10$ORYFQ4z.PVOdM26Ufd6jNOHAcfKAqAMiKZFIzY/hJ5VIfgI.WQH3m',
    },
  });

  // 2. Create Tasks with Task Entries
  await prisma.task.create({
    data: {
      title: 'Migrate database to new schema',
      status: 'OPEN',
      userId: user.id,
      taskEntries: {
        create: [
          {
            description: 'Initial planning and requirements gathering',
            minutes: 60,
          },
          { description: 'Writing migration scripts', minutes: 120 },
          { description: 'Testing migration on staging environment', minutes: 45 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Implement user authentication',
      status: 'OPEN',
      userId: user.id,
      taskEntries: {
        create: [
          { description: 'Setting up JWT authentication', minutes: 90 },
          {
            description: 'Writing login and registration endpoints',
            minutes: 60,
          },
          {
            description: 'Adding auth guards to protected routes',
            minutes: 30,
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: 'Set up CI/CD pipeline',
      status: 'CLOSED',
      userId: user.id,
      taskEntries: {
        create: [
          { description: 'Configuring GitHub Actions workflows', minutes: 45 },
          { description: 'Writing Dockerfiles for production build', minutes: 180 },
          {
            description: 'Setting up deployment scripts',
            minutes: 30,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
