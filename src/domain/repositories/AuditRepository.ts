/**
 * AuditLog Repository
 * S3: State Machine & Enforcement Layer
 *
 * Append-only repository for audit trail.
 * No update or delete operations - audit logs are immutable.
 */

import type Database from 'better-sqlite3';
import { AuditLog, type AuditLogType } from '../entities/AuditLog.js';

/**
 * AuditLog Repository
 *
 * Manages persistence of audit log entries.
 * Append-only: No updates or deletes allowed.
 */
export class AuditRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create new audit log entry
   *
   * Inserts immutable audit record into database.
   */
  create(auditLog: AuditLog): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (
        id, entity_type, entity_id, action,
        old_state, new_state, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      auditLog.id,
      auditLog.entity_type,
      auditLog.entity_id,
      auditLog.action,
      auditLog.old_state,
      auditLog.new_state,
      auditLog.metadata,
      auditLog.created_at
    );

    return auditLog;
  }

  /**
   * Find audit log entry by ID
   */
  findById(id: string): AuditLog | null {
    const stmt = this.db.prepare('SELECT * FROM audit_log WHERE id = ?');
    const row = stmt.get(id) as AuditLogType | undefined;

    if (!row) return null;

    return AuditLog.fromDatabase(row);
  }

  /**
   * Find all audit log entries for a specific entity
   */
  findByEntity(entity_type: string, entity_id: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(entity_type, entity_id) as AuditLogType[];
    return rows.map((row) => AuditLog.fromDatabase(row));
  }

  /**
   * Find all audit log entries for a specific action
   */
  findByAction(action: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE action = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(action) as AuditLogType[];
    return rows.map((row) => AuditLog.fromDatabase(row));
  }

  /**
   * Find all audit log entries in time range
   */
  findByTimeRange(start: string, end: string): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(start, end) as AuditLogType[];
    return rows.map((row) => AuditLog.fromDatabase(row));
  }

  /**
   * Get all audit log entries
   *
   * Use with caution - can return large result sets.
   * Consider using pagination in production.
   */
  findAll(): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      ORDER BY created_at ASC
    `);

    const rows = stmt.all() as AuditLogType[];
    return rows.map((row) => AuditLog.fromDatabase(row));
  }

  /**
   * Get count of audit log entries
   */
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM audit_log');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Get count of audit log entries for a specific entity
   */
  countByEntity(entity_type: string, entity_id: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_log
      WHERE entity_type = ? AND entity_id = ?
    `);
    const result = stmt.get(entity_type, entity_id) as { count: number };
    return result.count;
  }
}
