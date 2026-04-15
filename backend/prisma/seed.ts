import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    console.log('Database already seeded, skipping.');
    return;
  }

  // 1. Create a Seed User
  const user = await prisma.user.create({
    data: {
      email: 'lawyer@example.com',
      password: '$2b$10$EpD.1XgSOWT4L8/9Oeb0nO.XmXX93EOfcQY5Y9GkXF4P1uR.lR45q',
    },
  });

  // 2. Create Matters with Time Entries
  await prisma.matter.create({
    data: {
      title: 'Smith vs Jones Contract Review',
      clientName: 'John Smith',
      status: 'OPEN',
      userId: user.id,
      timeEntries: {
        create: [
          {
            description: 'Initial consultation and document gathering',
            minutes: 60,
          },
          { description: 'Reviewing non-disclosure agreements', minutes: 120 },
          { description: 'Drafting response to opposing counsel', minutes: 45 },
        ],
      },
    },
  });

  await prisma.matter.create({
    data: {
      title: 'Real Estate Purchase - 123 Main St',
      clientName: 'Alice Johnson',
      status: 'OPEN',
      userId: user.id,
      timeEntries: {
        create: [
          { description: 'Drafting purchase agreement', minutes: 90 },
          {
            description: 'Reviewing title report and disclosures',
            minutes: 60,
          },
          {
            description: 'Client meeting regarding property inspection',
            minutes: 30,
          },
        ],
      },
    },
  });

  await prisma.matter.create({
    data: {
      title: 'Corporate Incorporation - TechCorp',
      clientName: 'TechCorp LLC',
      status: 'CLOSED',
      userId: user.id,
      timeEntries: {
        create: [
          { description: 'Filing articles of incorporation', minutes: 45 },
          { description: 'Drafting operating agreement', minutes: 180 },
          {
            description: 'Preparing initial state tax registrations',
            minutes: 30,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
