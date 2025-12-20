import Database from 'better-sqlite3';

/**
 * Database schema migrations.
 * Creates all tables and constraints for CDW.
 */

export function runMigrations(db: Database.Database): void {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Single project row
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id TEXT PRIMARY KEY CHECK (id = 'singleton'),
      name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ensure singleton row exists
  db.prepare(
    `
    INSERT OR IGNORE INTO project (id, name)
    VALUES ('singleton', 'Untitled Project')
  `
  ).run();

  // Ideas (Parking Lot)
  db.exec(`
    CREATE TABLE IF NOT EXISTS idea (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('PARKED','PROMOTED','ABANDONED')) DEFAULT 'PARKED',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      promoted_at TEXT,
      abandoned_at TEXT
    );
  `);

  // Phases
  db.exec(`
    CREATE TABLE IF NOT EXISTS phase (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
      objective TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('ACTIVE','CLOSED')) DEFAULT 'ACTIVE',
      source_idea_id TEXT NOT NULL REFERENCES idea(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT
    );
  `);

  // FAILSAFE: At most one ACTIVE phase
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_phase
    ON phase(status) WHERE status = 'ACTIVE';
  `);

  // Documents
  db.exec(`
    CREATE TABLE IF NOT EXISTS document (
      id TEXT PRIMARY KEY,
      phase_id TEXT NOT NULL REFERENCES phase(id),
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Decisions
  db.exec(`
    CREATE TABLE IF NOT EXISTS decision (
      id TEXT PRIMARY KEY,
      phase_id TEXT NOT NULL REFERENCES phase(id),
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
      statement TEXT NOT NULL DEFAULT '',
      rationale TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('DRAFT','LOCKED')) DEFAULT 'DRAFT',
      content_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      locked_at TEXT
    );
  `);

  // Tasks
  db.exec(`
    CREATE TABLE IF NOT EXISTS task (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL REFERENCES decision(id),
      phase_id TEXT NOT NULL REFERENCES phase(id),
      title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('PENDING','COMPLETED','VOIDED')) DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      voided_at TEXT
    );
  `);

  // Document Snapshots (immutable)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_snapshot (
      id TEXT PRIMARY KEY,
      phase_id TEXT NOT NULL REFERENCES phase(id),
      original_document_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Audit Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_state TEXT,
      new_state TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Used confirmation tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS used_token (
      token TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      used_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
