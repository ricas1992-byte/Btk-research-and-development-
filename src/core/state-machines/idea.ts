import { IdeaStatus } from '../../types/entities.js';
import { InvalidStateTransitionError } from '../../types/errors.js';

/**
 * Idea state machine: PARKED → PROMOTED | ABANDONED
 * Both PROMOTED and ABANDONED are terminal states.
 */

const VALID_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  PARKED: ['PROMOTED', 'ABANDONED'],
  PROMOTED: [],
  ABANDONED: [],
};

export function canTransitionIdea(from: IdeaStatus, to: IdeaStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateIdeaTransition(from: IdeaStatus, to: IdeaStatus): void {
  if (!canTransitionIdea(from, to)) {
    throw new InvalidStateTransitionError(`Invalid idea transition: ${from} → ${to}`, {
      from,
      to,
      valid: VALID_TRANSITIONS[from],
    });
  }
}

export function isTerminalIdeaStatus(status: IdeaStatus): boolean {
  return status === 'PROMOTED' || status === 'ABANDONED';
}
