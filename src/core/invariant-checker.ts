import Database from 'better-sqlite3';
import {
  ActivePhaseExistsError,
  NoActivePhaseError,
  PhaseNotActiveError,
  DecisionNotDraftError,
  DecisionNotLockedError,
  TaskNotPendingError,
  LockedDecisionImmutableError,
  ClosedPhaseImmutableError,
} from '../types/errors.js';
import { Phase, DecisionStatus, PhaseStatus } from '../types/entities.js';

/**
 * Enforces core invariants of the CDW system.
 * These checks are PRIMARY authority; database constraints are FAILSAFE.
 */

export class InvariantChecker {
  constructor(private db: Database.Database) {}

  /**
   * MA-01: At most one ACTIVE phase exists
   */
  ensureNoActivePhase(): void {
    const count = this.db
      .prepare("SELECT COUNT(*) as count FROM phase WHERE status = 'ACTIVE'")
      .get() as { count: number };
    if (count.count > 0) {
      throw new ActivePhaseExistsError();
    }
  }

  ensureActivePhaseExists(): Phase {
    const phase = this.db.prepare("SELECT * FROM phase WHERE status = 'ACTIVE'").get() as
      | Phase
      | undefined;
    if (!phase) {
      throw new NoActivePhaseError();
    }
    return this.mapPhaseFromDb(phase);
  }

  ensurePhaseIsActive(phaseId: string): void {
    const phase = this.db.prepare('SELECT status FROM phase WHERE id = ?').get(phaseId) as
      | { status: PhaseStatus }
      | undefined;
    if (!phase || phase.status !== 'ACTIVE') {
      throw new PhaseNotActiveError(`Phase ${phaseId} is not active`);
    }
  }

  /**
   * MA-02: Locked decisions are immutable
   */
  ensureDecisionIsDraft(decisionId: string): void {
    const decision = this.db.prepare('SELECT status FROM decision WHERE id = ?').get(decisionId) as
      | { status: DecisionStatus }
      | undefined;
    if (!decision) {
      throw new DecisionNotDraftError(`Decision ${decisionId} not found`);
    }
    if (decision.status !== 'DRAFT') {
      throw new LockedDecisionImmutableError(
        `Cannot modify decision ${decisionId}: status is ${decision.status}`
      );
    }
  }

  ensureDecisionIsLocked(decisionId: string): void {
    const decision = this.db.prepare('SELECT status FROM decision WHERE id = ?').get(decisionId) as
      | { status: DecisionStatus }
      | undefined;
    if (!decision) {
      throw new DecisionNotLockedError(`Decision ${decisionId} not found`);
    }
    if (decision.status !== 'LOCKED') {
      throw new DecisionNotLockedError(`Cannot create task: decision ${decisionId} is not locked`);
    }
  }

  /**
   * MA-04: Closed phases are immutable
   */
  ensurePhaseNotClosed(phaseId: string): void {
    const phase = this.db.prepare('SELECT status FROM phase WHERE id = ?').get(phaseId) as
      | { status: PhaseStatus }
      | undefined;
    if (!phase) {
      throw new ClosedPhaseImmutableError(`Phase ${phaseId} not found`);
    }
    if (phase.status === 'CLOSED') {
      throw new ClosedPhaseImmutableError(`Cannot modify closed phase ${phaseId}`);
    }
  }

  /**
   * Task must be PENDING to transition
   */
  ensureTaskIsPending(taskId: string): void {
    const task = this.db.prepare('SELECT status FROM task WHERE id = ?').get(taskId) as
      | { status: string }
      | undefined;
    if (!task) {
      throw new TaskNotPendingError(`Task ${taskId} not found`);
    }
    if (task.status !== 'PENDING') {
      throw new TaskNotPendingError(`Task ${taskId} is not pending (status: ${task.status})`);
    }
  }

  private mapPhaseFromDb(row: any): Phase {
    return {
      id: row.id,
      title: row.title,
      objective: row.objective,
      status: row.status,
      sourceIdeaId: row.source_idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
    };
  }
}
