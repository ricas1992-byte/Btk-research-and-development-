/**
 * Phase Domain Entity
 * Section 0.5.3: Phase Entity Specification
 * Section 4.2: S2 Core Domain Implementation
 *
 * Represents a single work phase with enforced immutability and hash verification.
 */

import { v4 as uuidv4 } from 'uuid';
import { computePhaseHash } from '../../core/hash.js';
import type { Phase as PhaseType, PhaseStatus } from '../../core/types.js';

/**
 * Phase domain entity
 *
 * Factory pattern ensures hash is always computed correctly.
 * Immutable after creation (status changes create new instances).
 */
export class Phase implements PhaseType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: PhaseStatus;
  readonly created_at: string;
  readonly updated_at: string;
  readonly content_hash: string;

  private constructor(data: PhaseType) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.content_hash = data.content_hash;
  }

  /**
   * Create new Phase entity
   *
   * Generates ID, timestamps, and content hash automatically.
   * Initial status is always ACTIVE per Section 0.5.6.
   */
  static create(params: { name: string; description: string }): Phase {
    const id = uuidv4();
    const now = new Date().toISOString();
    const content_hash = computePhaseHash(id, params.name, params.description);

    return new Phase({
      id,
      name: params.name,
      description: params.description,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
      content_hash,
    });
  }

  /**
   * Reconstitute Phase from database
   *
   * Used by repository layer when loading from storage.
   */
  static fromDatabase(data: PhaseType): Phase {
    return new Phase(data);
  }

  /**
   * Update Phase properties
   *
   * Creates new instance with updated values and recomputed hash.
   * Per Section 0.5.5: "recomputed on update"
   */
  update(params: { name?: string; description?: string }): Phase {
    const name = params.name ?? this.name;
    const description = params.description ?? this.description;
    const updated_at = new Date().toISOString();
    const content_hash = computePhaseHash(this.id, name, description);

    return new Phase({
      ...this,
      name,
      description,
      updated_at,
      content_hash,
    });
  }

  /**
   * Transition to COMPLETED status
   *
   * Per Section 0.5.6: ACTIVE → COMPLETED (terminal)
   */
  complete(): Phase {
    if (this.status !== 'ACTIVE') {
      throw new Error(`Cannot complete phase in ${this.status} status`);
    }

    return new Phase({
      ...this,
      status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Transition to ABANDONED status
   *
   * Per Section 0.5.6: ACTIVE → ABANDONED (terminal)
   */
  abandon(): Phase {
    if (this.status !== 'ACTIVE') {
      throw new Error(`Cannot abandon phase in ${this.status} status`);
    }

    return new Phase({
      ...this,
      status: 'ABANDONED',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Check if phase is in terminal status
   */
  isTerminal(): boolean {
    return this.status === 'COMPLETED' || this.status === 'ABANDONED';
  }

  /**
   * Check if phase is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE';
  }
}
