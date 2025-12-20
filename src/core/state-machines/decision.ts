import { DecisionStatus } from '../../types/entities.js';
import { InvalidStateTransitionError } from '../../types/errors.js';

/**
 * Decision state machine: DRAFT → LOCKED
 * LOCKED is a terminal, immutable state.
 */

const VALID_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  DRAFT: ['LOCKED'],
  LOCKED: [],
};

export function canTransitionDecision(from: DecisionStatus, to: DecisionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateDecisionTransition(from: DecisionStatus, to: DecisionStatus): void {
  if (!canTransitionDecision(from, to)) {
    throw new InvalidStateTransitionError(`Invalid decision transition: ${from} → ${to}`, {
      from,
      to,
      valid: VALID_TRANSITIONS[from],
    });
  }
}

export function isTerminalDecisionStatus(status: DecisionStatus): boolean {
  return status === 'LOCKED';
}

export function isDecisionMutable(status: DecisionStatus): boolean {
  return status === 'DRAFT';
}
