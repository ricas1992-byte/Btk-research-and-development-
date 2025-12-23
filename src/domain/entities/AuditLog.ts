/**
 * AuditLog Domain Entity
 * S3: State Machine & Enforcement Layer
 *
 * Immutable audit trail for all state transitions and enforcement actions.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Audit log action types
 */
export type AuditAction =
  | 'PHASE_CREATED'
  | 'PHASE_UPDATED'
  | 'PHASE_COMPLETED'
  | 'PHASE_ABANDONED'
  | 'DECISION_CREATED'
  | 'DECISION_UPDATED'
  | 'DECISION_LOCKED'
  | 'DECISION_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_CANCELLED'
  | 'TASK_PAUSED'
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_UPDATED'
  | 'DOCUMENT_DELETED'
  | 'PARKING_LOT_CREATED'
  | 'PARKING_LOT_UPDATED'
  | 'PARKING_LOT_DELETED'
  | 'ENFORCEMENT_VIOLATION';

/**
 * Entity types that can be audited
 */
export type AuditEntityType = 'Phase' | 'Decision' | 'Task' | 'Document' | 'ParkingLot';

/**
 * AuditLog interface
 */
export interface AuditLogType {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  old_state: string | null;
  new_state: string | null;
  metadata: string | null; // JSON string for additional context
  created_at: string;
}

/**
 * AuditLog domain entity
 *
 * Immutable record of all state changes and enforcement actions.
 * No updates or deletes allowed - append-only log.
 */
export class AuditLog implements AuditLogType {
  readonly id: string;
  readonly entity_type: AuditEntityType;
  readonly entity_id: string;
  readonly action: AuditAction;
  readonly old_state: string | null;
  readonly new_state: string | null;
  readonly metadata: string | null;
  readonly created_at: string;

  private constructor(data: AuditLogType) {
    this.id = data.id;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.action = data.action;
    this.old_state = data.old_state;
    this.new_state = data.new_state;
    this.metadata = data.metadata;
    this.created_at = data.created_at;
  }

  /**
   * Create new AuditLog entry
   *
   * Automatically generates ID and timestamp.
   */
  static create(params: {
    entity_type: AuditEntityType;
    entity_id: string;
    action: AuditAction;
    old_state?: string | null;
    new_state?: string | null;
    metadata?: Record<string, any> | null;
  }): AuditLog {
    const id = uuidv4();
    const now = new Date().toISOString();

    return new AuditLog({
      id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      old_state: params.old_state ?? null,
      new_state: params.new_state ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      created_at: now,
    });
  }

  /**
   * Reconstitute AuditLog from database
   */
  static fromDatabase(data: AuditLogType): AuditLog {
    return new AuditLog(data);
  }

  /**
   * Parse metadata JSON
   */
  getMetadata(): Record<string, any> | null {
    if (!this.metadata) return null;
    try {
      return JSON.parse(this.metadata);
    } catch {
      return null;
    }
  }
}
