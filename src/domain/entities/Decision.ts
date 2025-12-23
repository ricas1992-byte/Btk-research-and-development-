/**
 * Decision Domain Entity
 * Section 0.5.3: Decision Entity Specification
 * Section 4.2: S2 Core Domain Implementation
 *
 * Immutable decision entity with lock mechanism.
 */

import { v4 as uuidv4 } from 'uuid';
import { computeDecisionHash } from '../../core/hash.js';
import type { Decision as DecisionType, DecisionStatus } from '../../core/types.js';

/**
 * Decision domain entity
 *
 * Per Section 0.5.3: "Content immutable after LOCKED status"
 * Factory pattern ensures hash is computed correctly.
 */
export class Decision implements DecisionType {
  readonly id: string;
  readonly phase_id: string;
  readonly content: string;
  readonly status: DecisionStatus;
  readonly created_at: string;
  readonly locked_at: string | null;
  readonly content_hash: string;

  private constructor(data: DecisionType) {
    this.id = data.id;
    this.phase_id = data.phase_id;
    this.content = data.content;
    this.status = data.status;
    this.created_at = data.created_at;
    this.locked_at = data.locked_at;
    this.content_hash = data.content_hash;
  }

  /**
   * Create new Decision entity
   *
   * Initial status is DRAFT per Section 0.5.6.
   * Content hash includes parent phase_id for hash chain.
   */
  static create(params: { phase_id: string; content: string }): Decision {
    const id = uuidv4();
    const now = new Date().toISOString();
    const content_hash = computeDecisionHash(params.phase_id, params.content);

    return new Decision({
      id,
      phase_id: params.phase_id,
      content: params.content,
      status: 'DRAFT',
      created_at: now,
      locked_at: null,
      content_hash,
    });
  }

  /**
   * Reconstitute Decision from database
   */
  static fromDatabase(data: DecisionType): Decision {
    return new Decision(data);
  }

  /**
   * Update Decision content
   *
   * Only allowed when status is DRAFT.
   * Per Section 0.5.3: Content immutable after LOCKED.
   */
  updateContent(content: string): Decision {
    if (this.status === 'LOCKED') {
      throw new Error('Cannot update locked decision (ENF-02: Decision immutability)');
    }

    const content_hash = computeDecisionHash(this.phase_id, content);

    return new Decision({
      ...this,
      content,
      content_hash,
    });
  }

  /**
   * Lock decision (make immutable)
   *
   * Per Section 0.5.6: DRAFT → LOCKED (terminal, immutable)
   * This is a one-way transition.
   */
  lock(): Decision {
    if (this.status === 'LOCKED') {
      throw new Error('Decision is already locked');
    }

    return new Decision({
      ...this,
      status: 'LOCKED',
      locked_at: new Date().toISOString(),
    });
  }

  /**
   * Check if decision is locked (immutable)
   */
  isLocked(): boolean {
    return this.status === 'LOCKED';
  }

  /**
   * Check if decision can be modified
   */
  canModify(): boolean {
    return this.status === 'DRAFT';
  }
}
