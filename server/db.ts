import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Create database file in the server directory
const dbPath = path.join(process.cwd(), 'server', 'database.sqlite');
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Run migrations automatically on startup
try {
  console.log('Running database migrations...');
  migrate(db, { migrationsFolder: './drizzle' });
  console.log('Database migrations completed successfully');
} catch (error) {
  console.error('Database migration error:', error);
  throw error;
}

export { sqlite };
