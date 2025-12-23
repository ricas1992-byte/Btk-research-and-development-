/**
 * Decision State Machine
 * Section 0.5.6: State Transition Specifications
 * S3: State Machine & Enforcement Layer
 *
 * State Transitions:
 * [INITIAL] → DRAFT
 * DRAFT → LOCKED
 * DRAFT → (deleted)
 * LOCKED → (terminal, immutable)
 */

import type { DecisionStatus } from '../types.js';

/**
 * Decision transition matrix per Section 0.5.6
 */
const VALID_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  DRAFT: ['LOCKED'],
  LOCKED: [],
};

/**
 * Check if a decision status transition is valid
 */
export function canTransitionDecision(from: DecisionStatus, to: DecisionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate decision state transition
 * Throws error if transition is invalid
 */
export function validateDecisionTransition(from: DecisionStatus, to: DecisionStatus): void {
  if (!canTransitionDecision(from, to)) {
    const validTransitions = VALID_TRANSITIONS[from]?.join(', ') || 'none';
    throw new Error(
      `Invalid decision transition: ${from} → ${to}. Valid transitions from ${from}: ${validTransitions}`
    );
  }
}

/**
 * Check if decision status is terminal (no further transitions allowed)
 */
export function isTerminalDecisionStatus(status: DecisionStatus): boolean {
  return status === 'LOCKED';
}

/**
 * Check if decision is mutable
 * DRAFT decisions can be modified, LOCKED decisions cannot (ENF-02)
 */
export function isDecisionMutable(status: DecisionStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Check if decision is locked
 */
export function isDecisionLocked(status: DecisionStatus): boolean {
  return status === 'LOCKED';
}

/**
 * Get all valid transitions from a given decision status
 */
export function getValidDecisionTransitions(from: DecisionStatus): DecisionStatus[] {
  return VALID_TRANSITIONS[from] || [];
}
