/**
 * Database Connection Management for CDW
 * Section 0.5.1: Technology Stack - SQLite 3.x via better-sqlite3
 *
 * Provides singleton database connection with:
 * - Foreign key enforcement
 * - WAL (Write-Ahead Logging) mode for performance
 * - Migration support
 * - Proper connection lifecycle management
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { DatabaseConfig } from '../core/types.js';

/**
 * Default database configuration
 */
const DEFAULT_CONFIG: DatabaseConfig = {
  path: process.env.DB_PATH || path.join(process.cwd(), 'data', 'cdw.db'),
  enableWAL: true,
  enableForeignKeys: true,
};

/**
 * Singleton database instance
 */
let dbInstance: Database.Database | null = null;

/**
 * Initialize database connection
 *
 * Creates data directory if it doesn't exist.
 * Enables foreign keys and WAL mode.
 * Runs migrations to ensure schema is current.
 *
 * @param config - Database configuration (optional, uses defaults if not provided)
 * @returns Database instance
 */
export function initDatabase(config: Partial<DatabaseConfig> = {}): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Ensure data directory exists
  const dir = path.dirname(finalConfig.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create database connection
  dbInstance = new Database(finalConfig.path);

  // Enable foreign keys (critical for referential integrity)
  if (finalConfig.enableForeignKeys) {
    dbInstance.pragma('foreign_keys = ON');
  }

  // Enable WAL mode for better concurrent performance
  if (finalConfig.enableWAL) {
    dbInstance.pragma('journal_mode = WAL');
  }

  // Run migrations
  runMigrations(dbInstance);

  return dbInstance;
}

/**
 * Get current database instance
 *
 * Initializes if not already initialized.
 *
 * @returns Database instance
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 *
 * Cleans up singleton instance.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Reset database (DESTRUCTIVE)
 *
 * Closes connection, deletes database file, and reinitializes.
 * Used for testing and development only.
 *
 * WARNING: This permanently deletes all data.
 */
export function resetDatabase(): void {
  const dbPath = DEFAULT_CONFIG.path;

  closeDatabase();

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Also remove WAL and SHM files if they exist
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;

  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }

  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }

  initDatabase();
}

/**
 * Run database migrations
 *
 * Applies all pending migrations in order.
 * Migrations are stored in /src/db/migrations/
 *
 * @param db - Database instance
 */
function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Get applied migrations
  const appliedMigrations = db.prepare('SELECT id FROM _migrations ORDER BY id').all() as Array<{
    id: string;
  }>;

  const appliedIds = new Set(appliedMigrations.map((m) => m.id));

  // Load and apply pending migrations
  const migrationsDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    // No migrations directory yet - this is OK during initial S1 setup
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const migrationId = file.replace('.sql', '');

    if (appliedIds.has(migrationId)) {
      // Migration already applied
      continue;
    }

    // Read and execute migration
    const migrationPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(migrationId, file);
    });

    transaction();

    console.log(`Applied migration: ${file}`);
  }
}

/**
 * Check database connection health
 *
 * @returns true if database is accessible and responsive
 */
export function checkDatabaseHealth(): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as health').get() as { health: number } | undefined;
    return result?.health === 1;
  } catch (error) {
    return false;
  }
}

/**
 * Get database statistics
 *
 * @returns Object with database statistics
 */
export function getDatabaseStats(): {
  path: string;
  size: number;
  pageCount: number;
  pageSize: number;
} {
  const db = getDatabase();
  const pageCount = db.pragma('page_count', { simple: true }) as number;
  const pageSize = db.pragma('page_size', { simple: true }) as number;

  return {
    path: DEFAULT_CONFIG.path,
    size: pageCount * pageSize,
    pageCount,
    pageSize,
  };
}
