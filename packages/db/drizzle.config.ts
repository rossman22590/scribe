import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, '../..');

for (const envFile of [
  path.join(packageDir, '.env.local'),
  path.join(packageDir, '.env'),
  path.join(repoRoot, 'apps/saru/.env.local'),
  path.join(repoRoot, 'apps/saru/.env'),
  path.join(repoRoot, '.env.local'),
  path.join(repoRoot, '.env'),
]) {
  dotenv.config({ path: envFile });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required in packages/db/.env, apps/saru/.env, or the process environment');
}

export default {
  schema: path.join(packageDir, 'src/schema.ts'),
  out: path.join(packageDir, 'migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
