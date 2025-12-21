/**
 * Decision Repository
 * Section 4.2: S2 Repository Implementation
 */

import type Database from 'better-sqlite3';
import { Decision } from '../entities/Decision.js';
import { verifyDecisionHashOrThrow } from '../../core/verification.js';
import type { Decision as DecisionType } from '../../core/types.js';

export class DecisionRepository {
  constructor(private db: Database.Database) {}

  create(decision: Decision): Decision {
    const stmt = this.db.prepare(`
      INSERT INTO decision (id, phase_id, content, status, created_at, locked_at, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      decision.id,
      decision.phase_id,
      decision.content,
      decision.status,
      decision.created_at,
      decision.locked_at,
      decision.content_hash
    );

    return decision;
  }

  findById(id: string): Decision | null {
    const stmt = this.db.prepare('SELECT * FROM decision WHERE id = ?');
    const row = stmt.get(id) as DecisionType | undefined;

    if (!row) {
      return null;
    }

    const decision = Decision.fromDatabase(row);
    verifyDecisionHashOrThrow(decision);

    return decision;
  }

  findByPhaseId(phaseId: string): Decision[] {
    const stmt = this.db.prepare('SELECT * FROM decision WHERE phase_id = ? ORDER BY created_at');
    const rows = stmt.all(phaseId) as DecisionType[];

    return rows.map((row) => {
      const decision = Decision.fromDatabase(row);
      verifyDecisionHashOrThrow(decision);
      return decision;
    });
  }

  findLockedByPhaseId(phaseId: string): Decision[] {
    const stmt = this.db.prepare(
      "SELECT * FROM decision WHERE phase_id = ? AND status = 'LOCKED' ORDER BY locked_at"
    );
    const rows = stmt.all(phaseId) as DecisionType[];

    return rows.map((row) => {
      const decision = Decision.fromDatabase(row);
      verifyDecisionHashOrThrow(decision);
      return decision;
    });
  }

  update(decision: Decision): Decision {
    const stmt = this.db.prepare(`
      UPDATE decision
      SET content = ?, status = ?, locked_at = ?, content_hash = ?
      WHERE id = ?
    `);

    stmt.run(decision.content, decision.status, decision.locked_at, decision.content_hash, decision.id);

    return decision;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM decision WHERE id = ?');
    stmt.run(id);
  }
}
