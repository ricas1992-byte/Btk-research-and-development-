import Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function initDatabase(dbPath: string = config.databasePath): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(dbPath);
  runMigrations(dbInstance);

  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function resetDatabase(): void {
  closeDatabase();
  if (fs.existsSync(config.databasePath)) {
    fs.unlinkSync(config.databasePath);
  }
  initDatabase();
}
