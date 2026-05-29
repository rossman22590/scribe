import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required in packages/db/.env, apps/saru/.env, or the process environment');
  }

  const migrationClient = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? 'require'
      : process.env.NODE_ENV === 'production'
        ? 'require'
        : false,
  });

  console.log('Running migrations...');

  const start = Date.now();

  await migrate(drizzle(migrationClient), {
    migrationsFolder: path.join(packageDir, 'migrations'),
  });

  const end = Date.now();

  console.log(`Migrations completed in ${end - start}ms`);

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('Migration failed');
  console.error(err);
  process.exit(1);
});
