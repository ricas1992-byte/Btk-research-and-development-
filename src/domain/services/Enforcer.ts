/**
 * Enforcer Service
 * S3: State Machine & Enforcement Layer
 * Section 0.5.4: Enforcement Rules
 *
 * Central coordinator for all enforcement rules and state transitions.
 * All state changes must go through the Enforcer to ensure discipline.
 */

import type Database from 'better-sqlite3';
import { PhaseRepository } from '../repositories/PhaseRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { AuditLog, type AuditAction, type AuditEntityType } from '../entities/AuditLog.js';
import { validatePhaseTransition } from '../../core/state-machines/phase.js';
import { validateDecisionTransition } from '../../core/state-machines/decision.js';
import { validateTaskTransition } from '../../core/state-machines/task.js';
import type { Phase } from '../entities/Phase.js';
import type { Decision } from '../entities/Decision.js';
import type { Task } from '../entities/Task.js';
import type { PhaseStatus, DecisionStatus, TaskStatus } from '../../core/types.js';

/**
 * Enforcer - Central authority for all enforcement rules
 *
 * Responsibilities:
 * 1. Enforce all state transition rules per Section 0.5.6
 * 2. Enforce all business rules per Section 0.5.4 (ENF-01 through ENF-06)
 * 3. Audit all state changes
 * 4. Coordinate between repositories and services
 */
export class Enforcer {
  private phaseRepo: PhaseRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.phaseRepo = new PhaseRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  // ============================================================================
  // ENF-01: Single Active Phase Constraint
  // ============================================================================

  /**
   * ENF-01: Ensure no active phase exists
   *
   * Throws error if an active phase already exists.
   * Must be called before creating a new phase.
   */
  enforceNoActivePhase(): void {
    if (this.phaseRepo.hasActivePhase()) {
      this.logEnforcementViolation('Phase', 'unknown', {
        rule: 'ENF-01',
        description: 'Single Active Phase Constraint',
        reason: 'Cannot create phase when active phase already exists',
      });
      throw new Error('Cannot create phase: Active phase already exists (ENF-01)');
    }
  }

  /**
   * ENF-01: Verify phase is active
   *
   * Throws error if phase is not in ACTIVE status.
   * Used when operations require an active phase.
   */
  enforcePhaseIsActive(phase: Phase): void {
    if (!phase.isActive()) {
      this.logEnforcementViolation('Phase', phase.id, {
        rule: 'ENF-04',
        description: 'Phase Must Be Active',
        current_status: phase.status,
        reason: 'Operation requires phase to be ACTIVE',
      });
      throw new Error(`Phase ${phase.id} is not active (status: ${phase.status})`);
    }
  }

  // ============================================================================
  // ENF-02: Decision Immutability After Lock
  // ============================================================================

  /**
   * ENF-02: Ensure decision is mutable (DRAFT status)
   *
   * Throws error if decision is LOCKED.
   * Must be called before updating or deleting a decision.
   */
  enforceDecisionIsDraft(decision: Decision): void {
    if (decision.isLocked()) {
      this.logEnforcementViolation('Decision', decision.id, {
        rule: 'ENF-02',
        description: 'Decision Immutability After Lock',
        status: decision.status,
        locked_at: decision.locked_at,
        reason: 'Cannot modify locked decision',
      });
      throw new Error('Cannot modify locked decision (ENF-02)');
    }
  }

  /**
   * ENF-02: Ensure decision can be deleted
   *
   * LOCKED decisions cannot be deleted.
   */
  enforceDecisionCanBeDeleted(decision: Decision): void {
    if (decision.isLocked()) {
      this.logEnforcementViolation('Decision', decision.id, {
        rule: 'ENF-02',
        description: 'Decision Immutability After Lock',
        status: decision.status,
        reason: 'Cannot delete locked decision',
      });
      throw new Error('Cannot delete locked decision (ENF-02)');
    }
  }

  // ============================================================================
  // ENF-03: Task from Locked Decision Only
  // ============================================================================

  /**
   * ENF-03: Ensure decision is locked before creating task
   *
   * Tasks can only be created from LOCKED decisions.
   * Must be called before creating a task.
   */
  enforceDecisionIsLocked(decision: Decision): void {
    if (!decision.isLocked()) {
      this.logEnforcementViolation('Decision', decision.id, {
        rule: 'ENF-03',
        description: 'Task from Locked Decision Only',
        status: decision.status,
        reason: 'Cannot create task from unlocked decision',
      });
      throw new Error('Cannot create task from unlocked decision (ENF-03)');
    }
  }

  // ============================================================================
  // ENF-04: Phase Must Be Active for Operations
  // ============================================================================

  /**
   * ENF-04: Ensure phase is active for creating entities
   *
   * Decisions and documents can only be created in ACTIVE phases.
   */
  enforcePhaseIsActiveForCreation(phase: Phase): void {
    if (!phase.isActive()) {
      this.logEnforcementViolation('Phase', phase.id, {
        rule: 'ENF-04',
        description: 'Phase Must Be Active for Operations',
        status: phase.status,
        reason: 'Cannot create entities in non-active phase',
      });
      throw new Error(`Cannot create entities in ${phase.status} phase (ENF-04)`);
    }
  }

  // ============================================================================
  // ENF-05: Phase Must Be Active for Updates
  // ============================================================================

  /**
   * ENF-05: Ensure phase is active for updating entities
   *
   * Entities cannot be updated in terminal phases.
   */
  enforcePhaseIsActiveForUpdate(phase: Phase): void {
    if (phase.isTerminal()) {
      this.logEnforcementViolation('Phase', phase.id, {
        rule: 'ENF-05',
        description: 'Phase Must Be Active for Updates',
        status: phase.status,
        reason: 'Cannot update entities in terminal phase',
      });
      throw new Error(`Cannot update entities in ${phase.status} phase (ENF-05)`);
    }
  }

  // ============================================================================
  // ENF-06: Phase Terminal States Are Immutable
  // ============================================================================

  /**
   * ENF-06: Ensure phase is not in terminal state
   *
   * COMPLETED and ABANDONED phases cannot be modified.
   */
  enforcePhaseNotTerminal(phase: Phase): void {
    if (phase.isTerminal()) {
      this.logEnforcementViolation('Phase', phase.id, {
        rule: 'ENF-06',
        description: 'Phase Terminal States Are Immutable',
        status: phase.status,
        reason: 'Cannot modify phase in terminal state',
      });
      throw new Error(`Cannot modify phase in terminal state ${phase.status} (ENF-06)`);
    }
  }

  // ============================================================================
  // State Transition Enforcement
  // ============================================================================

  /**
   * Enforce phase state transition
   *
   * Validates transition is legal per state machine.
   * Logs transition to audit log.
   */
  enforcePhaseTransition(phase: Phase, newStatus: PhaseStatus): void {
    validatePhaseTransition(phase.status, newStatus);

    this.logStateTransition('Phase', phase.id, phase.status, newStatus, {
      name: phase.name,
      description: phase.description,
    });
  }

  /**
   * Enforce decision state transition
   *
   * Validates transition is legal per state machine.
   * Logs transition to audit log.
   */
  enforceDecisionTransition(decision: Decision, newStatus: DecisionStatus): void {
    validateDecisionTransition(decision.status, newStatus);

    this.logStateTransition('Decision', decision.id, decision.status, newStatus, {
      phase_id: decision.phase_id,
      content_length: decision.content.length,
    });
  }

  /**
   * Enforce task state transition
   *
   * Validates transition is legal per state machine.
   * Logs transition to audit log.
   */
  enforceTaskTransition(task: Task, newStatus: TaskStatus): void {
    validateTaskTransition(task.status, newStatus);

    this.logStateTransition('Task', task.id, task.status, newStatus, {
      decision_id: task.decision_id,
      title: task.title,
    });
  }

  // ============================================================================
  // Audit Logging
  // ============================================================================

  /**
   * Log enforcement rule violation
   *
   * Records attempted violations to audit log for security analysis.
   */
  private logEnforcementViolation(
    entityType: AuditEntityType,
    entityId: string,
    metadata: Record<string, any>
  ): void {
    const auditLog = AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action: 'ENFORCEMENT_VIOLATION',
      metadata,
    });

    this.auditRepo.create(auditLog);
  }

  /**
   * Log state transition
   *
   * Records successful state transitions to audit log.
   */
  private logStateTransition(
    entityType: AuditEntityType,
    entityId: string,
    oldState: string,
    newState: string,
    metadata: Record<string, any>
  ): void {
    // Determine action based on entity type and transition
    const action = this.getAuditAction(entityType, newState);

    const auditLog = AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_state: oldState,
      new_state: newState,
      metadata,
    });

    this.auditRepo.create(auditLog);
  }

  /**
   * Determine audit action from entity type and new state
   */
  private getAuditAction(entityType: AuditEntityType, newState: string): AuditAction {
    if (entityType === 'Phase') {
      if (newState === 'COMPLETED') return 'PHASE_COMPLETED';
      if (newState === 'ABANDONED') return 'PHASE_ABANDONED';
    } else if (entityType === 'Decision') {
      if (newState === 'LOCKED') return 'DECISION_LOCKED';
    } else if (entityType === 'Task') {
      if (newState === 'IN_PROGRESS') return 'TASK_STARTED';
      if (newState === 'COMPLETED') return 'TASK_COMPLETED';
      if (newState === 'CANCELLED') return 'TASK_CANCELLED';
      if (newState === 'PENDING') return 'TASK_PAUSED';
    }

    // Generic action if no specific mapping
    return 'ENFORCEMENT_VIOLATION';
  }

  /**
   * Log entity creation
   */
  logEntityCreation(
    entityType: AuditEntityType,
    entityId: string,
    metadata: Record<string, any>
  ): void {
    const actionMap: Record<AuditEntityType, AuditAction> = {
      Phase: 'PHASE_CREATED',
      Decision: 'DECISION_CREATED',
      Task: 'TASK_CREATED',
      Document: 'DOCUMENT_CREATED',
      ParkingLot: 'PARKING_LOT_CREATED',
    };

    const auditLog = AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action: actionMap[entityType],
      metadata,
    });

    this.auditRepo.create(auditLog);
  }

  /**
   * Log entity update
   */
  logEntityUpdate(
    entityType: AuditEntityType,
    entityId: string,
    metadata: Record<string, any>
  ): void {
    const actionMap: Record<AuditEntityType, AuditAction> = {
      Phase: 'PHASE_UPDATED',
      Decision: 'DECISION_UPDATED',
      Task: 'TASK_UPDATED',
      Document: 'DOCUMENT_UPDATED',
      ParkingLot: 'PARKING_LOT_UPDATED',
    };

    const auditLog = AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action: actionMap[entityType],
      metadata,
    });

    this.auditRepo.create(auditLog);
  }

  /**
   * Log entity deletion
   */
  logEntityDeletion(
    entityType: AuditEntityType,
    entityId: string,
    metadata: Record<string, any>
  ): void {
    const actionMap: Record<AuditEntityType, AuditAction> = {
      Phase: 'PHASE_ABANDONED', // Phases don't get deleted, they get abandoned
      Decision: 'DECISION_DELETED',
      Task: 'TASK_CANCELLED', // Tasks don't get deleted, they get cancelled
      Document: 'DOCUMENT_DELETED',
      ParkingLot: 'PARKING_LOT_DELETED',
    };

    const auditLog = AuditLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action: actionMap[entityType],
      metadata,
    });

    this.auditRepo.create(auditLog);
  }
}
