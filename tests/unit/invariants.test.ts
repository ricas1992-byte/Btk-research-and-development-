import { describe, it, expect } from 'vitest';
import { getDatabase } from '../../src/persistence/database.js';
import { Gateway } from '../../src/persistence/gateway.js';
import { InvariantChecker } from '../../src/core/invariant-checker.js';
import {
  ActivePhaseExistsError,
  NoActivePhaseError,
  PhaseNotActiveError,
  DecisionNotLockedError,
  TaskNotPendingError,
  LockedDecisionImmutableError,
  ClosedPhaseImmutableError,
} from '../../src/types/errors.js';

describe('Invariant Checker', () => {
  it('MA-01: enforces single active phase', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea1 = gateway.createIdea('Idea 1', 'Description');
    gateway.updateIdeaStatus(idea1.id, 'PROMOTED');
    const phase1 = gateway.createPhase('Phase 1', 'Objective', idea1.id);

    expect(() => checker.ensureNoActivePhase()).toThrow(ActivePhaseExistsError);

    gateway.updatePhaseStatus(phase1.id, 'CLOSED');
    expect(() => checker.ensureNoActivePhase()).not.toThrow();
  });

  it('ensures active phase exists', () => {
    const db = getDatabase();
    const checker = new InvariantChecker(db);

    expect(() => checker.ensureActivePhaseExists()).toThrow(NoActivePhaseError);
  });

  it('ensures phase is active', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    expect(() => checker.ensurePhaseIsActive(phase.id)).not.toThrow();

    gateway.updatePhaseStatus(phase.id, 'CLOSED');
    expect(() => checker.ensurePhaseIsActive(phase.id)).toThrow(PhaseNotActiveError);
  });

  it('MA-02: ensures decision is draft for mutation', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    expect(() => checker.ensureDecisionIsDraft(decision.id)).not.toThrow();

    gateway.lockDecision(decision.id);
    expect(() => checker.ensureDecisionIsDraft(decision.id)).toThrow(LockedDecisionImmutableError);
  });

  it('ensures decision is locked for task creation', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    expect(() => checker.ensureDecisionIsLocked(decision.id)).toThrow(DecisionNotLockedError);

    gateway.lockDecision(decision.id);
    expect(() => checker.ensureDecisionIsLocked(decision.id)).not.toThrow();
  });

  it('MA-04: ensures phase is not closed for mutations', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    expect(() => checker.ensurePhaseNotClosed(phase.id)).not.toThrow();

    gateway.updatePhaseStatus(phase.id, 'CLOSED');
    expect(() => checker.ensurePhaseNotClosed(phase.id)).toThrow(ClosedPhaseImmutableError);
  });

  it('ensures task is pending for transitions', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');
    gateway.lockDecision(decision.id);
    const task = gateway.createTask(decision.id, phase.id, 'Task', 'Description');

    expect(() => checker.ensureTaskIsPending(task.id)).not.toThrow();

    gateway.updateTaskStatus(task.id, 'COMPLETED');
    expect(() => checker.ensureTaskIsPending(task.id)).toThrow(TaskNotPendingError);
  });
});
