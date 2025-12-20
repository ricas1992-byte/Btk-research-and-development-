import { PhaseStatus } from '../../types/entities.js';
import { InvalidStateTransitionError } from '../../types/errors.js';

/**
 * Phase state machine: ACTIVE → CLOSED
 * CLOSED is a terminal state.
 */

const VALID_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  ACTIVE: ['CLOSED'],
  CLOSED: [],
};

export function canTransitionPhase(from: PhaseStatus, to: PhaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validatePhaseTransition(from: PhaseStatus, to: PhaseStatus): void {
  if (!canTransitionPhase(from, to)) {
    throw new InvalidStateTransitionError(`Invalid phase transition: ${from} → ${to}`, {
      from,
      to,
      valid: VALID_TRANSITIONS[from],
    });
  }
}

export function isTerminalPhaseStatus(status: PhaseStatus): boolean {
  return status === 'CLOSED';
}
