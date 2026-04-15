import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx ts-node prisma/seed.ts',
  },
  datasource: {
    // Use DATABASE_URL_LOCAL when running Prisma CLI outside of Docker (local dev),
    // fall back to DATABASE_URL which uses the Docker service hostname.
    url: process.env['DATABASE_URL_LOCAL'] ?? process.env['DATABASE_URL'],
  },
});
