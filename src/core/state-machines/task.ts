import { TaskStatus } from '../../types/entities.js';
import { InvalidStateTransitionError } from '../../types/errors.js';

/**
 * Task state machine: PENDING → COMPLETED | VOIDED
 * Both COMPLETED and VOIDED are terminal states.
 */

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['COMPLETED', 'VOIDED'],
  COMPLETED: [],
  VOIDED: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTask(from, to)) {
    throw new InvalidStateTransitionError(`Invalid task transition: ${from} → ${to}`, {
      from,
      to,
      valid: VALID_TRANSITIONS[from],
    });
  }
}

export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'COMPLETED' || status === 'VOIDED';
}
