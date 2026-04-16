import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

export default function globalSetup() {
  config({ path: resolve(__dirname, '../../.env') });

  const testDbUrl = process.env['DATABASE_URL_TEST'];
  if (!testDbUrl) {
    throw new Error('DATABASE_URL_TEST is not set in .env');
  }

  process.env['JWT_SECRET'] ??= 'test-secret';
  process.env['DATABASE_URL'] = testDbUrl;

  // Run Prisma migrations against the test database.
  // Pre-set DATABASE_URL_LOCAL to the test URL so prisma.config.ts uses it
  execSync(`npx prisma migrate deploy --schema=prisma/schema.prisma`, {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL_LOCAL: testDbUrl,
      DATABASE_URL: testDbUrl,
    },
  });
}
