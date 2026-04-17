import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Wipes all application tables in FK-safe order: TimeEntry → Matter → User.
 * Use this in beforeAll/afterAll hooks to ensure a clean test database state.
 */
export const clearDatabase = async (prisma: PrismaService): Promise<void> => {
  await prisma.timeEntry.deleteMany();
  await prisma.matter.deleteMany();
  await prisma.user.deleteMany();
}
