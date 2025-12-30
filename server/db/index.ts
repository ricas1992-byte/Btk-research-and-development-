import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database file location
const DB_PATH = join(process.cwd(), 'data', 'btk.db');

// Initialize database connection
export const db = new Database(DB_PATH, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initDatabase() {
  console.log('Initializing database schema...');

  // Read and execute schema
  const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schemaSQL);

  console.log('Database schema initialized');
}

/**
 * Seed database with initial data
 */
export async function seedDatabase() {
  console.log('Seeding database...');

  // Create default user if not exists
  const existingUser = db.prepare('SELECT id FROM user WHERE email = ?').get('admin@beyondthekeys.ai');

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    db.prepare(`
      INSERT INTO user (id, email, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run('user-001', 'admin@beyondthekeys.ai', passwordHash);

    // Create default document
    db.prepare(`
      INSERT INTO document (id, user_id, title, content, created_at, updated_at, writing_phase)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?)
    `).run('doc-001', 'user-001', 'Untitled', '', 'NOTES');

    console.log('Created default user and document');
  }

  // Run seed SQL
  const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
  db.exec(seedSQL);

  console.log('Database seeded successfully');
}

/**
 * Get database instance (for queries)
 */
export function getDb() {
  return db;
}
