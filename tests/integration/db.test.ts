/**
 * Integration Tests for Database Layer
 * Section 4.1: S1 requires minimum 15 test cases for db.test.ts
 *
 * Tests database connection, schema, migrations, and basic operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initDatabase,
  getDatabase,
  closeDatabase,
  resetDatabase,
  checkDatabaseHealth,
  getDatabaseStats,
} from '../../src/db/connection.js';
import {
  computePhaseHash,
  computeDecisionHash,
  computeTaskHash,
  computeDocumentHash,
} from '../../src/core/hash.js';

describe('Database Integration', () => {
  beforeEach(() => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    resetDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  // TEST 1: Database initialization
  it('should initialize database successfully', () => {
    const db = initDatabase();
    expect(db).toBeDefined();
  });

  // TEST 2: Database singleton pattern
  it('should return same instance on subsequent calls', () => {
    const db1 = getDatabase();
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  // TEST 3: Database health check
  it('should pass health check when database is accessible', () => {
    initDatabase();
    const healthy = checkDatabaseHealth();
    expect(healthy).toBe(true);
  });

  // TEST 4: Foreign keys enabled
  it('should have foreign keys enabled', () => {
    const db = initDatabase();
    const result = db.pragma('foreign_keys', { simple: true });
    expect(result).toBe(1);
  });

  // TEST 5: WAL mode enabled
  it('should have WAL mode enabled', () => {
    const db = initDatabase();
    const result = db.pragma('journal_mode', { simple: true });
    expect(result).toBe('wal');
  });

  // TEST 6: Schema - Phase table exists
  it('should create phase table with correct schema', () => {
    const db = initDatabase();
    const tableInfo = db.pragma('table_info(phase)') as Array<{ name: string }>;

    const columnNames = tableInfo.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('content_hash');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  // TEST 7: Schema - Decision table exists
  it('should create decision table with correct schema', () => {
    const db = initDatabase();
    const tableInfo = db.pragma('table_info(decision)') as Array<{ name: string }>;

    const columnNames = tableInfo.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('phase_id');
    expect(columnNames).toContain('content');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('content_hash');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('locked_at');
  });

  // TEST 8: Schema - Task table exists
  it('should create task table with correct schema', () => {
    const db = initDatabase();
    const tableInfo = db.pragma('table_info(task)') as Array<{ name: string }>;

    const columnNames = tableInfo.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('decision_id');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('content_hash');
  });

  // TEST 9: Schema - Document table exists
  it('should create document table with correct schema', () => {
    const db = initDatabase();
    const tableInfo = db.pragma('table_info(document)') as Array<{ name: string }>;

    const columnNames = tableInfo.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('phase_id');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('content');
    expect(columnNames).toContain('content_hash');
  });

  // TEST 10: Schema - ParkingLot table exists
  it('should create parking_lot table with correct schema', () => {
    const db = initDatabase();
    const tableInfo = db.pragma('table_info(parking_lot)') as Array<{ name: string }>;

    const columnNames = tableInfo.map((col) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('content');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('source_phase_id');
  });

  // TEST 11: Insert and query Phase
  it('should insert and query phase records', () => {
    const db = initDatabase();

    const phaseId = 'phase-test-1';
    const name = 'Test Phase';
    const description = 'Test description';
    const hash = computePhaseHash(phaseId, name, description);

    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES (?, ?, ?, 'ACTIVE', ?)
    `
    ).run(phaseId, name, description, hash);

    const result = db.prepare('SELECT * FROM phase WHERE id = ?').get(phaseId) as any;

    expect(result).toBeDefined();
    expect(result.name).toBe(name);
    expect(result.status).toBe('ACTIVE');
    expect(result.content_hash).toBe(hash);
  });

  // TEST 12: Single active phase constraint
  it('should enforce single active phase constraint', () => {
    const db = initDatabase();

    // Insert first active phase
    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES ('phase-1', 'Phase 1', 'Desc 1', 'ACTIVE', 'hash1')
    `
    ).run();

    // Attempt to insert second active phase should fail
    expect(() => {
      db.prepare(
        `
        INSERT INTO phase (id, name, description, status, content_hash)
        VALUES ('phase-2', 'Phase 2', 'Desc 2', 'ACTIVE', 'hash2')
      `
      ).run();
    }).toThrow();
  });

  // TEST 13: Insert and query Decision
  it('should insert and query decision records', () => {
    const db = initDatabase();

    // First create a phase
    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES ('phase-1', 'Phase', 'Desc', 'ACTIVE', 'hash1')
    `
    ).run();

    const decisionId = 'decision-test-1';
    const phaseId = 'phase-1';
    const content = 'Decision content';
    const hash = computeDecisionHash(phaseId, content);

    db.prepare(
      `
      INSERT INTO decision (id, phase_id, content, status, content_hash)
      VALUES (?, ?, ?, 'DRAFT', ?)
    `
    ).run(decisionId, phaseId, content, hash);

    const result = db.prepare('SELECT * FROM decision WHERE id = ?').get(decisionId) as any;

    expect(result).toBeDefined();
    expect(result.content).toBe(content);
    expect(result.status).toBe('DRAFT');
    expect(result.phase_id).toBe(phaseId);
  });

  // TEST 14: Foreign key constraint - Decision requires Phase
  it('should enforce foreign key constraint on decision.phase_id', () => {
    const db = initDatabase();

    // Attempt to insert decision without phase should fail
    expect(() => {
      db.prepare(
        `
        INSERT INTO decision (id, phase_id, content, status, content_hash)
        VALUES ('decision-1', 'nonexistent-phase', 'Content', 'DRAFT', 'hash1')
      `
      ).run();
    }).toThrow();
  });

  // TEST 15: Insert and query Task
  it('should insert and query task records', () => {
    const db = initDatabase();

    // Create phase and decision first
    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES ('phase-1', 'Phase', 'Desc', 'ACTIVE', 'hash1')
    `
    ).run();

    db.prepare(
      `
      INSERT INTO decision (id, phase_id, content, status, content_hash, locked_at)
      VALUES ('decision-1', 'phase-1', 'Content', 'LOCKED', 'hash2', datetime('now'))
    `
    ).run();

    const taskId = 'task-test-1';
    const decisionId = 'decision-1';
    const title = 'Task title';
    const description = 'Task description';
    const hash = computeTaskHash(decisionId, title, description);

    db.prepare(
      `
      INSERT INTO task (id, decision_id, title, description, status, content_hash)
      VALUES (?, ?, ?, ?, 'PENDING', ?)
    `
    ).run(taskId, decisionId, title, description, hash);

    const result = db.prepare('SELECT * FROM task WHERE id = ?').get(taskId) as any;

    expect(result).toBeDefined();
    expect(result.title).toBe(title);
    expect(result.status).toBe('PENDING');
  });

  // TEST 16: Insert and query Document
  it('should insert and query document records', () => {
    const db = initDatabase();

    // Create phase first
    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES ('phase-1', 'Phase', 'Desc', 'ACTIVE', 'hash1')
    `
    ).run();

    const docId = 'doc-test-1';
    const phaseId = 'phase-1';
    const title = 'Document title';
    const content = 'Plain text content';
    const hash = computeDocumentHash(phaseId, title, content);

    db.prepare(
      `
      INSERT INTO document (id, phase_id, title, content, content_hash)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(docId, phaseId, title, content, hash);

    const result = db.prepare('SELECT * FROM document WHERE id = ?').get(docId) as any;

    expect(result).toBeDefined();
    expect(result.title).toBe(title);
    expect(result.content).toBe(content);
  });

  // TEST 17: Insert and query ParkingLot
  it('should insert and query parking_lot records', () => {
    const db = initDatabase();

    const parkingId = 'parking-test-1';
    const content = 'Parking lot idea';

    db.prepare(
      `
      INSERT INTO parking_lot (id, content)
      VALUES (?, ?)
    `
    ).run(parkingId, content);

    const result = db.prepare('SELECT * FROM parking_lot WHERE id = ?').get(parkingId) as any;

    expect(result).toBeDefined();
    expect(result.content).toBe(content);
  });

  // TEST 18: Cascade delete - Phase deletion cascades to Decisions
  it('should cascade delete decisions when phase is deleted', () => {
    const db = initDatabase();

    db.prepare(
      `
      INSERT INTO phase (id, name, description, status, content_hash)
      VALUES ('phase-1', 'Phase', 'Desc', 'ACTIVE', 'hash1')
    `
    ).run();

    db.prepare(
      `
      INSERT INTO decision (id, phase_id, content, status, content_hash)
      VALUES ('decision-1', 'phase-1', 'Content', 'DRAFT', 'hash2')
    `
    ).run();

    // Verify decision exists
    let decision = db.prepare('SELECT * FROM decision WHERE id = ?').get('decision-1');
    expect(decision).toBeDefined();

    // Delete phase
    db.prepare('DELETE FROM phase WHERE id = ?').run('phase-1');

    // Verify decision was cascaded
    decision = db.prepare('SELECT * FROM decision WHERE id = ?').get('decision-1');
    expect(decision).toBeUndefined();
  });

  // TEST 19: Database stats
  it('should return database statistics', () => {
    initDatabase();
    const stats = getDatabaseStats();

    expect(stats).toBeDefined();
    expect(stats.path).toBeDefined();
    expect(stats.pageCount).toBeGreaterThan(0);
    expect(stats.pageSize).toBeGreaterThan(0);
    expect(stats.size).toBeGreaterThan(0);
  });

  // TEST 20: Migration tracking table
  it('should create and use migrations tracking table', () => {
    const db = initDatabase();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .all();

    expect(tables).toHaveLength(1);
  });
});
