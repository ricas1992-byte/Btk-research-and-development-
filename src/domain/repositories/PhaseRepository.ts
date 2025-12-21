/**
 * Phase Repository
 * Section 4.2: S2 Repository Implementation
 *
 * Data access layer with hash verification per Section 0.5.5
 */

import type Database from 'better-sqlite3';
import { Phase } from '../entities/Phase.js';
import { verifyPhaseHashOrThrow } from '../../core/verification.js';
import type { Phase as PhaseType } from '../../core/types.js';

export class PhaseRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create new phase
   *
   * Hash computed by entity factory.
   */
  create(phase: Phase): Phase {
    const stmt = this.db.prepare(`
      INSERT INTO phase (id, name, description, status, created_at, updated_at, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      phase.id,
      phase.name,
      phase.description,
      phase.status,
      phase.created_at,
      phase.updated_at,
      phase.content_hash
    );

    return phase;
  }

  /**
   * Find phase by ID
   *
   * Per Section 0.5.5: "verified on read"
   * Throws HashVerificationError if hash mismatch (hard stop).
   */
  findById(id: string): Phase | null {
    const stmt = this.db.prepare('SELECT * FROM phase WHERE id = ?');
    const row = stmt.get(id) as PhaseType | undefined;

    if (!row) {
      return null;
    }

    // Hash verification per Section 0.5.5
    const phase = Phase.fromDatabase(row);
    verifyPhaseHashOrThrow(phase);

    return phase;
  }

  /**
   * Find active phase
   *
   * Per Section 0.5.4: Maximum one ACTIVE phase at any time.
   */
  findActive(): Phase | null {
    const stmt = this.db.prepare("SELECT * FROM phase WHERE status = 'ACTIVE'");
    const row = stmt.get() as PhaseType | undefined;

    if (!row) {
      return null;
    }

    const phase = Phase.fromDatabase(row);
    verifyPhaseHashOrThrow(phase);

    return phase;
  }

  /**
   * Find all phases
   */
  findAll(): Phase[] {
    const stmt = this.db.prepare('SELECT * FROM phase ORDER BY created_at DESC');
    const rows = stmt.all() as PhaseType[];

    return rows.map((row) => {
      const phase = Phase.fromDatabase(row);
      verifyPhaseHashOrThrow(phase);
      return phase;
    });
  }

  /**
   * Update phase
   *
   * Hash recomputed by entity.
   */
  update(phase: Phase): Phase {
    const stmt = this.db.prepare(`
      UPDATE phase
      SET name = ?, description = ?, status = ?, updated_at = ?, content_hash = ?
      WHERE id = ?
    `);

    stmt.run(
      phase.name,
      phase.description,
      phase.status,
      phase.updated_at,
      phase.content_hash,
      phase.id
    );

    return phase;
  }

  /**
   * Delete phase
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM phase WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Check if active phase exists
   */
  hasActivePhase(): boolean {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM phase WHERE status = 'ACTIVE'");
    const result = stmt.get() as { count: number };
    return result.count > 0;
  }
}
