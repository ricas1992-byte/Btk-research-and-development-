import { describe, it, expect } from 'vitest';
import { getDatabase } from '../../src/persistence/database.js';
import { Gateway } from '../../src/persistence/gateway.js';
import { InvariantChecker } from '../../src/core/invariant-checker.js';
import { v4 as uuidv4 } from 'uuid';

describe('Acceptance Tests - Workflows', () => {
  it('MA-01: Single active phase constraint', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea1 = gateway.createIdea('First Idea', 'Description');
    gateway.updateIdeaStatus(idea1.id, 'PROMOTED');
    const phase1 = gateway.createPhase('First Phase', 'Objective', idea1.id);

    expect(phase1.status).toBe('ACTIVE');

    const idea2 = gateway.createIdea('Second Idea', 'Description');
    gateway.updateIdeaStatus(idea2.id, 'PROMOTED');

    expect(() => {
      gateway.createPhase('Second Phase', 'Objective', idea2.id);
    }).toThrow();

    gateway.updatePhaseStatus(phase1.id, 'CLOSED');
    const phase2 = gateway.createPhase('Second Phase', 'Objective', idea2.id);
    expect(phase2.status).toBe('ACTIVE');
  });

  it('MA-02: Locked decision immutability', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    expect(decision.status).toBe('DRAFT');
    expect(() => gateway.updateDecision(decision.id, { title: 'Updated' })).not.toThrow();

    const locked = gateway.lockDecision(decision.id);
    expect(locked.status).toBe('LOCKED');
    expect(locked.contentHash).toBeTruthy();

    expect(() => checker.ensureDecisionIsDraft(decision.id)).toThrow();
  });

  it('MA-03: Task creation from locked only', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);
    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');

    expect(() => checker.ensureDecisionIsLocked(decision.id)).toThrow();

    gateway.lockDecision(decision.id);
    expect(() => checker.ensureDecisionIsLocked(decision.id)).not.toThrow();

    const task = gateway.createTask(decision.id, phase.id, 'Task', 'Description');
    expect(task.status).toBe('PENDING');
  });

  it('MA-04: Phase close creates snapshots', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    const doc1 = gateway.createDocument(phase.id, 'Doc 1', 'Content 1');
    const doc2 = gateway.createDocument(phase.id, 'Doc 2', 'Content 2');

    const snapshotsBefore = gateway.getSnapshots(phase.id);
    expect(snapshotsBefore.length).toBe(0);

    gateway.createSnapshot(phase.id, doc1.id, doc1.title, doc1.content);
    gateway.createSnapshot(phase.id, doc2.id, doc2.title, doc2.content);
    gateway.updatePhaseStatus(phase.id, 'CLOSED');

    const snapshotsAfter = gateway.getSnapshots(phase.id);
    expect(snapshotsAfter.length).toBe(2);
    expect(snapshotsAfter[0].contentHash).toBeTruthy();
    expect(snapshotsAfter[1].contentHash).toBeTruthy();
  });

  it('MA-05: Closed phase immutability', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    gateway.updatePhaseStatus(phase.id, 'CLOSED');

    expect(() => checker.ensurePhaseIsActive(phase.id)).toThrow();
    expect(() => checker.ensurePhaseNotClosed(phase.id)).toThrow();
  });

  it('FT-01: Complete workflow (idea → phase → close)', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea = gateway.createIdea('Build Feature X', 'A comprehensive feature');
    expect(idea.status).toBe('PARKED');

    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase(idea.title, idea.description, idea.id);
    expect(phase.status).toBe('ACTIVE');

    const doc = gateway.createDocument(phase.id, 'Requirements', 'List of requirements');
    expect(doc.phaseId).toBe(phase.id);

    const decision = gateway.createDecision(
      phase.id,
      'Use Framework Y',
      'We will use Y',
      'Because X'
    );
    expect(decision.status).toBe('DRAFT');

    gateway.lockDecision(decision.id);
    const lockedDecision = gateway.getDecision(decision.id);
    expect(lockedDecision.status).toBe('LOCKED');

    const task = gateway.createTask(decision.id, phase.id, 'Implement core logic', 'Details');
    expect(task.status).toBe('PENDING');

    gateway.updateTaskStatus(task.id, 'COMPLETED');
    const completedTask = gateway.getTask(task.id);
    expect(completedTask.status).toBe('COMPLETED');

    gateway.createSnapshot(phase.id, doc.id, doc.title, doc.content);
    gateway.updatePhaseStatus(phase.id, 'CLOSED');

    const closedPhase = gateway.getPhase(phase.id);
    expect(closedPhase.status).toBe('CLOSED');

    const snapshots = gateway.getSnapshots(phase.id);
    expect(snapshots.length).toBeGreaterThan(0);
  });

  it('FT-02: Two-step phase close', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    gateway.createPhase('Phase', 'Objective', idea.id);

    const token = uuidv4();

    expect(gateway.isTokenUsed(token)).toBe(false);

    gateway.markTokenAsUsed(token, 'close-phase');

    expect(gateway.isTokenUsed(token)).toBe(true);

    expect(() => gateway.markTokenAsUsed(token, 'close-phase')).toThrow();
  });

  it('FT-03: Hash verification', () => {
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea = gateway.createIdea('Idea', 'Description');
    gateway.updateIdeaStatus(idea.id, 'PROMOTED');
    const phase = gateway.createPhase('Phase', 'Objective', idea.id);

    const decision = gateway.createDecision(phase.id, 'Decision', 'Statement', 'Rationale');
    const locked = gateway.lockDecision(decision.id);

    expect(locked.contentHash).toBeTruthy();
    expect(locked.contentHash?.startsWith('v1:')).toBe(true);

    const doc = gateway.createDocument(phase.id, 'Doc', 'Content');
    const snapshot = gateway.createSnapshot(phase.id, doc.id, doc.title, doc.content);

    expect(snapshot.contentHash).toBeTruthy();
    expect(snapshot.contentHash.startsWith('v1:')).toBe(true);
  });
});
