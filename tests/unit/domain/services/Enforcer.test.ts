/**
 * Enforcer Service Tests
 * S3: State Machine & Enforcement Layer
 * Tests all enforcement rules (ENF-01 through ENF-06)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { Enforcer } from '../../../../src/domain/services/Enforcer.js';
import { Phase } from '../../../../src/domain/entities/Phase.js';
import { Decision } from '../../../../src/domain/entities/Decision.js';
import { Task } from '../../../../src/domain/entities/Task.js';
import { PhaseRepository } from '../../../../src/domain/repositories/PhaseRepository.js';
import { DecisionRepository } from '../../../../src/domain/repositories/DecisionRepository.js';
import { TaskRepository } from '../../../../src/domain/repositories/TaskRepository.js';
import { AuditRepository } from '../../../../src/domain/repositories/AuditRepository.js';
import fs from 'fs';
import path from 'path';

describe('Enforcer Service', () => {
  let db: Database.Database;
  let enforcer: Enforcer;
  let phaseRepo: PhaseRepository;
  let decisionRepo: DecisionRepository;
  let taskRepo: TaskRepository;
  let auditRepo: AuditRepository;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Load schema
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // Load audit_log migration
    const auditMigrationPath = path.join(
      process.cwd(),
      'src',
      'db',
      'migrations',
      '002_audit_log.sql'
    );
    const auditMigration = fs.readFileSync(auditMigrationPath, 'utf-8');
    db.exec(auditMigration);

    // Initialize services
    enforcer = new Enforcer(db);
    phaseRepo = new PhaseRepository(db);
    decisionRepo = new DecisionRepository(db);
    taskRepo = new TaskRepository(db);
    auditRepo = new AuditRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  // ==========================================================================
  // ENF-01: Single Active Phase Constraint
  // ==========================================================================

  describe('ENF-01: Single Active Phase Constraint', () => {
    it('should allow creating phase when no active phase exists', () => {
      expect(() => enforcer.enforceNoActivePhase()).not.toThrow();
    });

    it('should throw error when active phase already exists', () => {
      // Create active phase
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      // Attempt to create another should fail
      expect(() => enforcer.enforceNoActivePhase()).toThrow(/ENF-01/);
      expect(() => enforcer.enforceNoActivePhase()).toThrow(/Active phase already exists/);
    });

    it('should allow creating phase after completing previous phase', () => {
      // Create and complete phase
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const completed = phase.complete();
      phaseRepo.update(completed);

      // Now creating new phase should work
      expect(() => enforcer.enforceNoActivePhase()).not.toThrow();
    });

    it('should allow creating phase after abandoning previous phase', () => {
      // Create and abandon phase
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const abandoned = phase.abandon();
      phaseRepo.update(abandoned);

      // Now creating new phase should work
      expect(() => enforcer.enforceNoActivePhase()).not.toThrow();
    });

    it('should log enforcement violation to audit log', () => {
      // Create active phase
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const beforeCount = auditRepo.count();

      // Attempt violation
      try {
        enforcer.enforceNoActivePhase();
      } catch (e) {
        // Expected to throw
      }

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      // Verify audit log entry
      const violations = auditRepo.findByAction('ENFORCEMENT_VIOLATION');
      expect(violations.length).toBeGreaterThan(0);

      const latestViolation = violations[violations.length - 1];
      expect(latestViolation.entity_type).toBe('Phase');
      expect(latestViolation.action).toBe('ENFORCEMENT_VIOLATION');

      const metadata = latestViolation.getMetadata();
      expect(metadata?.rule).toBe('ENF-01');
    });
  });

  // ==========================================================================
  // ENF-02: Decision Immutability After Lock
  // ==========================================================================

  describe('ENF-02: Decision Immutability After Lock', () => {
    let phase: Phase;

    beforeEach(() => {
      phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);
    });

    it('should allow modifying DRAFT decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });

      expect(() => enforcer.enforceDecisionIsDraft(decision)).not.toThrow();
    });

    it('should throw error when modifying LOCKED decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });
      const locked = decision.lock();

      expect(() => enforcer.enforceDecisionIsDraft(locked)).toThrow(/ENF-02/);
      expect(() => enforcer.enforceDecisionIsDraft(locked)).toThrow(/locked decision/);
    });

    it('should allow deleting DRAFT decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });

      expect(() => enforcer.enforceDecisionCanBeDeleted(decision)).not.toThrow();
    });

    it('should throw error when deleting LOCKED decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });
      const locked = decision.lock();

      expect(() => enforcer.enforceDecisionCanBeDeleted(locked)).toThrow(/ENF-02/);
      expect(() => enforcer.enforceDecisionCanBeDeleted(locked)).toThrow(/delete locked/);
    });

    it('should log enforcement violation to audit log', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });
      const locked = decision.lock();

      const beforeCount = auditRepo.count();

      try {
        enforcer.enforceDecisionIsDraft(locked);
      } catch (e) {
        // Expected to throw
      }

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      const violations = auditRepo.findByAction('ENFORCEMENT_VIOLATION');
      const latestViolation = violations[violations.length - 1];

      const metadata = latestViolation.getMetadata();
      expect(metadata?.rule).toBe('ENF-02');
    });
  });

  // ==========================================================================
  // ENF-03: Task from Locked Decision Only
  // ==========================================================================

  describe('ENF-03: Task from Locked Decision Only', () => {
    let phase: Phase;

    beforeEach(() => {
      phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);
    });

    it('should throw error when creating task from DRAFT decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });

      expect(() => enforcer.enforceDecisionIsLocked(decision)).toThrow(/ENF-03/);
      expect(() => enforcer.enforceDecisionIsLocked(decision)).toThrow(/unlocked decision/);
    });

    it('should allow creating task from LOCKED decision', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });
      const locked = decision.lock();

      expect(() => enforcer.enforceDecisionIsLocked(locked)).not.toThrow();
    });

    it('should log enforcement violation to audit log', () => {
      const decision = Decision.create({
        phase_id: phase.id,
        content: 'Test decision',
      });

      const beforeCount = auditRepo.count();

      try {
        enforcer.enforceDecisionIsLocked(decision);
      } catch (e) {
        // Expected to throw
      }

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      const violations = auditRepo.findByAction('ENFORCEMENT_VIOLATION');
      const latestViolation = violations[violations.length - 1];

      const metadata = latestViolation.getMetadata();
      expect(metadata?.rule).toBe('ENF-03');
    });
  });

  // ==========================================================================
  // ENF-04: Phase Must Be Active for Creation
  // ==========================================================================

  describe('ENF-04: Phase Must Be Active for Creation', () => {
    it('should allow operations on ACTIVE phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      expect(() => enforcer.enforcePhaseIsActiveForCreation(phase)).not.toThrow();
    });

    it('should throw error when phase is COMPLETED', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const completed = phase.complete();

      expect(() => enforcer.enforcePhaseIsActiveForCreation(completed)).toThrow(/ENF-04/);
      expect(() => enforcer.enforcePhaseIsActiveForCreation(completed)).toThrow(
        /COMPLETED phase/
      );
    });

    it('should throw error when phase is ABANDONED', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const abandoned = phase.abandon();

      expect(() => enforcer.enforcePhaseIsActiveForCreation(abandoned)).toThrow(/ENF-04/);
      expect(() => enforcer.enforcePhaseIsActiveForCreation(abandoned)).toThrow(
        /ABANDONED phase/
      );
    });
  });

  // ==========================================================================
  // ENF-05: Phase Must Be Active for Updates
  // ==========================================================================

  describe('ENF-05: Phase Must Be Active for Updates', () => {
    it('should allow updates on ACTIVE phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });

      expect(() => enforcer.enforcePhaseIsActiveForUpdate(phase)).not.toThrow();
    });

    it('should throw error when updating entities in COMPLETED phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const completed = phase.complete();

      expect(() => enforcer.enforcePhaseIsActiveForUpdate(completed)).toThrow(/ENF-05/);
      expect(() => enforcer.enforcePhaseIsActiveForUpdate(completed)).toThrow(
        /COMPLETED phase/
      );
    });

    it('should throw error when updating entities in ABANDONED phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const abandoned = phase.abandon();

      expect(() => enforcer.enforcePhaseIsActiveForUpdate(abandoned)).toThrow(/ENF-05/);
      expect(() => enforcer.enforcePhaseIsActiveForUpdate(abandoned)).toThrow(
        /ABANDONED phase/
      );
    });
  });

  // ==========================================================================
  // ENF-06: Phase Terminal States Are Immutable
  // ==========================================================================

  describe('ENF-06: Phase Terminal States Are Immutable', () => {
    it('should allow modifying ACTIVE phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });

      expect(() => enforcer.enforcePhaseNotTerminal(phase)).not.toThrow();
    });

    it('should throw error when modifying COMPLETED phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const completed = phase.complete();

      expect(() => enforcer.enforcePhaseNotTerminal(completed)).toThrow(/ENF-06/);
      expect(() => enforcer.enforcePhaseNotTerminal(completed)).toThrow(/terminal state/);
    });

    it('should throw error when modifying ABANDONED phase', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const abandoned = phase.abandon();

      expect(() => enforcer.enforcePhaseNotTerminal(abandoned)).toThrow(/ENF-06/);
      expect(() => enforcer.enforcePhaseNotTerminal(abandoned)).toThrow(/terminal state/);
    });
  });

  // ==========================================================================
  // State Transition Enforcement
  // ==========================================================================

  describe('State Transition Enforcement', () => {
    it('should enforce valid phase transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });

      expect(() => enforcer.enforcePhaseTransition(phase, 'COMPLETED')).not.toThrow();
      expect(() => enforcer.enforcePhaseTransition(phase, 'ABANDONED')).not.toThrow();
    });

    it('should reject invalid phase transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      const completed = phase.complete();

      expect(() => enforcer.enforcePhaseTransition(completed, 'ACTIVE')).toThrow();
    });

    it('should enforce valid decision transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const decision = Decision.create({ phase_id: phase.id, content: 'Test' });

      expect(() => enforcer.enforceDecisionTransition(decision, 'LOCKED')).not.toThrow();
    });

    it('should reject invalid decision transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const decision = Decision.create({ phase_id: phase.id, content: 'Test' });
      const locked = decision.lock();

      expect(() => enforcer.enforceDecisionTransition(locked, 'DRAFT')).toThrow();
    });

    it('should enforce valid task transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const decision = Decision.create({ phase_id: phase.id, content: 'Test' });
      const locked = decision.lock();
      decisionRepo.create(locked);

      const task = Task.create({
        decision_id: locked.id,
        title: 'Test Task',
        description: 'Test',
      });

      expect(() => enforcer.enforceTaskTransition(task, 'IN_PROGRESS')).not.toThrow();
    });

    it('should reject invalid task transitions', () => {
      const phase = Phase.create({ name: 'Test Phase', description: 'Test' });
      phaseRepo.create(phase);

      const decision = Decision.create({ phase_id: phase.id, content: 'Test' });
      const locked = decision.lock();
      decisionRepo.create(locked);

      const task = Task.create({
        decision_id: locked.id,
        title: 'Test Task',
        description: 'Test',
      });
      const completed = task.start().complete();

      expect(() => enforcer.enforceTaskTransition(completed, 'PENDING')).toThrow();
    });
  });

  // ==========================================================================
  // Audit Logging Integration
  // ==========================================================================

  describe('Audit Logging Integration', () => {
    it('should log entity creation', () => {
      const beforeCount = auditRepo.count();

      enforcer.logEntityCreation('Phase', 'test-id', { name: 'Test Phase' });

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      const logs = auditRepo.findByEntity('Phase', 'test-id');
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('PHASE_CREATED');
    });

    it('should log entity update', () => {
      const beforeCount = auditRepo.count();

      enforcer.logEntityUpdate('Decision', 'test-id', { content: 'Updated content' });

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      const logs = auditRepo.findByEntity('Decision', 'test-id');
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('DECISION_UPDATED');
    });

    it('should log entity deletion', () => {
      const beforeCount = auditRepo.count();

      enforcer.logEntityDeletion('Document', 'test-id', { title: 'Deleted doc' });

      const afterCount = auditRepo.count();
      expect(afterCount).toBe(beforeCount + 1);

      const logs = auditRepo.findByEntity('Document', 'test-id');
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('DOCUMENT_DELETED');
    });
  });
});
