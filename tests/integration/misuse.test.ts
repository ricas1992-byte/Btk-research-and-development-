import { describe, it, expect } from 'vitest';
import { getDatabase } from '../../src/persistence/database.js';
import { Gateway } from '../../src/persistence/gateway.js';
import { InvariantChecker } from '../../src/core/invariant-checker.js';
import {
  ActivePhaseExistsError,
  LockedDecisionImmutableError,
  DecisionNotLockedError,
  PhaseNotActiveError,
  ClosedPhaseImmutableError,
} from '../../src/types/errors.js';

describe('Misuse Prevention Tests', () => {
  it('prevents creating second active phase', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea1 = gateway.createIdea('Idea 1', 'Description');
    gateway.updateIdeaStatus(idea1.id, 'PROMOTED');
    gateway.createPhase('Phase 1', 'Objective', idea1.id);

    const idea2 = gateway.createIdea('Idea 2', 'Description');
    gateway.updateIdeaStatus(idea2.id, 'PROMOTED');

    expect(() => checker.ensureNoActivePhase()).toThrow(ActivePhaseExistsError);
  });

  it('prevents editing locked decision', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    gateway.lockDecision(decision.id);

    expect(() => checker.ensureDecisionIsDraft(decision.id)).toThrow(LockedDecisionImmutableError);
  });

  it('prevents creating task from draft decision', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    expect(() => checker.ensureDecisionIsLocked(decision.id)).toThrow(DecisionNotLockedError);
  });

  it('prevents creating document in closed phase', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    gateway.updatePhaseStatus(phase.id, 'CLOSED');

    expect(() => checker.ensurePhaseIsActive(phase.id)).toThrow(PhaseNotActiveError);
  });

  it('prevents modifying closed phase', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    gateway.updatePhaseStatus(phase.id, 'CLOSED');

    expect(() => checker.ensurePhaseNotClosed(phase.id)).toThrow(ClosedPhaseImmutableError);
  });

  it('prevents deleting locked decision', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    gateway.lockDecision(decision.id);

    expect(() => checker.ensureDecisionIsDraft(decision.id)).toThrow(LockedDecisionImmutableError);
  });

  it('database constraint prevents multiple active phases', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea1 = gateway.createIdea('Idea 1', 'Description');
    gateway.updateIdeaStatus(idea1.id, 'PROMOTED');
    gateway.createPhase('Phase 1', 'Objective', idea1.id);

    const idea2 = gateway.createIdea('Idea 2', 'Description');
    gateway.updateIdeaStatus(idea2.id, 'PROMOTED');

    expect(() => {
      gateway.createPhase('Phase 2', 'Objective', idea2.id);
    }).toThrow();
  });
});
