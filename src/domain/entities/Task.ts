/**
 * Task Domain Entity
 * Section 0.5.3: Task Entity Specification
 * Section 4.2: S2 Core Domain Implementation
 *
 * Executable work derived from locked decisions.
 */

import { v4 as uuidv4 } from 'uuid';
import { computeTaskHash } from '../../core/hash.js';
import type { Task as TaskType, TaskStatus } from '../../core/types.js';

/**
 * Task domain entity
 *
 * Per Section 0.5.3: "Can only be created from a LOCKED decision"
 * Constraint enforcement is in service layer (S2) and enforcement layer (S3).
 */
export class Task implements TaskType {
  readonly id: string;
  readonly decision_id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly created_at: string;
  readonly updated_at: string;
  readonly content_hash: string;

  private constructor(data: TaskType) {
    this.id = data.id;
    this.decision_id = data.decision_id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.content_hash = data.content_hash;
  }

  /**
   * Create new Task entity
   *
   * Initial status is PENDING per Section 0.5.6.
   * Hash includes parent decision_id for hash chain.
   */
  static create(params: { decision_id: string; title: string; description: string }): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    const content_hash = computeTaskHash(params.decision_id, params.title, params.description);

    return new Task({
      id,
      decision_id: params.decision_id,
      title: params.title,
      description: params.description,
      status: 'PENDING',
      created_at: now,
      updated_at: now,
      content_hash,
    });
  }

  /**
   * Reconstitute Task from database
   */
  static fromDatabase(data: TaskType): Task {
    return new Task(data);
  }

  /**
   * Update Task properties
   *
   * Recomputes hash per Section 0.5.5.
   */
  update(params: { title?: string; description?: string }): Task {
    const title = params.title ?? this.title;
    const description = params.description ?? this.description;
    const updated_at = new Date().toISOString();
    const content_hash = computeTaskHash(this.decision_id, title, description);

    return new Task({
      ...this,
      title,
      description,
      updated_at,
      content_hash,
    });
  }

  /**
   * Start task (PENDING → IN_PROGRESS)
   *
   * Per Section 0.5.6 state transitions.
   */
  start(): Task {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot start task in ${this.status} status`);
    }

    return new Task({
      ...this,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Complete task (IN_PROGRESS → COMPLETED)
   *
   * Terminal state per Section 0.5.6.
   */
  complete(): Task {
    if (this.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot complete task in ${this.status} status`);
    }

    return new Task({
      ...this,
      status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Cancel task (PENDING or IN_PROGRESS → CANCELLED)
   *
   * Terminal state per Section 0.5.6.
   */
  cancel(): Task {
    if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
      throw new Error(`Cannot cancel task in ${this.status} status`);
    }

    return new Task({
      ...this,
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Pause task (IN_PROGRESS → PENDING)
   *
   * Per Section 0.5.6: allows returning to PENDING.
   */
  pause(): Task {
    if (this.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot pause task in ${this.status} status`);
    }

    return new Task({
      ...this,
      status: 'PENDING',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Check if task is in terminal status
   */
  isTerminal(): boolean {
    return this.status === 'COMPLETED' || this.status === 'CANCELLED';
  }
}
