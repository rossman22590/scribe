import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  // Log an error, but don't throw, to allow Vercel env vars to work
  console.error('🔴 DATABASE_URL environment variable is not set in the runtime environment.');
}

// --- Start Debug Logging ---
console.log(`[DB Connection] NODE_ENV: ${process.env.NODE_ENV}`);
const isProduction = process.env.NODE_ENV === 'production';
// Check if URL explicitly requires SSL or if we're in production
const requiresSsl = process.env.DATABASE_URL?.includes('sslmode=require') || isProduction;
const sslSetting = requiresSsl ? ('require' as const) : undefined;
console.log(`[DB Connection] SSL Setting: ${sslSetting === undefined ? 'undefined (disabled)' : sslSetting}`);
// --- End Debug Logging ---

const connectionOptions: postgres.Options<Record<string, postgres.PostgresType>> = {
  max: 1, // Suitable for serverless or local dev
  // Require SSL if URL specifies it or if in production
  ssl: sslSetting
};

// Log the URL being used (without credentials for safety)
const urlLog = process.env.DATABASE_URL?.split('@')?.[1] ?? 'URL not set or invalid';
console.log(`Attempting to connect DB client to: ${urlLog}`);

// Create the connection pool
// Use process.env.DATABASE_URL or a default dummy URL if not set
const queryClient = postgres(process.env.DATABASE_URL || 'postgresql://invalid:invalid@invalid/invalid', connectionOptions);

// Create the Drizzle instance
export const db = drizzle(queryClient, { schema, logger: process.env.NODE_ENV === 'development' }); // Enable logger in dev

// Re-export the schema for easy imports in the app
export * from './schema'; 