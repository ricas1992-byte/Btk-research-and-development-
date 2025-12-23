/**
 * Phase State Machine
 * Section 0.5.6: State Transition Specifications
 * S3: State Machine & Enforcement Layer
 *
 * State Transitions:
 * [INITIAL] → ACTIVE
 * ACTIVE → COMPLETED
 * ACTIVE → ABANDONED
 * COMPLETED → (terminal)
 * ABANDONED → (terminal)
 */

import type { PhaseStatus } from '../types.js';

/**
 * Phase transition matrix per Section 0.5.6
 */
const VALID_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  ACTIVE: ['COMPLETED', 'ABANDONED'],
  COMPLETED: [],
  ABANDONED: [],
};

/**
 * Check if a phase status transition is valid
 */
export function canTransitionPhase(from: PhaseStatus, to: PhaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate phase state transition
 * Throws error if transition is invalid
 */
export function validatePhaseTransition(from: PhaseStatus, to: PhaseStatus): void {
  if (!canTransitionPhase(from, to)) {
    const validTransitions = VALID_TRANSITIONS[from]?.join(', ') || 'none';
    throw new Error(
      `Invalid phase transition: ${from} → ${to}. Valid transitions from ${from}: ${validTransitions}`
    );
  }
}

/**
 * Check if phase status is terminal (no further transitions allowed)
 */
export function isTerminalPhaseStatus(status: PhaseStatus): boolean {
  return status === 'COMPLETED' || status === 'ABANDONED';
}

/**
 * Check if phase is active
 */
export function isActivePhaseStatus(status: PhaseStatus): boolean {
  return status === 'ACTIVE';
}

/**
 * Get all valid transitions from a given phase status
 */
export function getValidPhaseTransitions(from: PhaseStatus): PhaseStatus[] {
  return VALID_TRANSITIONS[from] || [];
}
