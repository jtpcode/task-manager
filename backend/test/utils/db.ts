import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Wipes all application tables in FK-safe order: TaskEntry → Task → User.
 * Use this in beforeAll/afterAll hooks to ensure a clean test database state.
 */
export const clearDatabase = async (prisma: PrismaService): Promise<void> => {
  await prisma.taskEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
};
