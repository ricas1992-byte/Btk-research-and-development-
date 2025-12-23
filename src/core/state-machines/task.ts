/**
 * Task State Machine
 * Section 0.5.6: State Transition Specifications
 * S3: State Machine & Enforcement Layer
 *
 * State Transitions:
 * [INITIAL] → PENDING
 * PENDING → IN_PROGRESS
 * PENDING → CANCELLED
 * IN_PROGRESS → COMPLETED
 * IN_PROGRESS → PENDING (pause)
 * IN_PROGRESS → CANCELLED
 * COMPLETED → (terminal)
 * CANCELLED → (terminal)
 */

import type { TaskStatus } from '../types.js';

/**
 * Task transition matrix per Section 0.5.6
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'PENDING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Check if a task status transition is valid
 */
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate task state transition
 * Throws error if transition is invalid
 */
export function validateTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTask(from, to)) {
    const validTransitions = VALID_TRANSITIONS[from]?.join(', ') || 'none';
    throw new Error(
      `Invalid task transition: ${from} → ${to}. Valid transitions from ${from}: ${validTransitions}`
    );
  }
}

/**
 * Check if task status is terminal (no further transitions allowed)
 */
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Check if task is in progress
 */
export function isTaskInProgress(status: TaskStatus): boolean {
  return status === 'IN_PROGRESS';
}

/**
 * Check if task is pending
 */
export function isTaskPending(status: TaskStatus): boolean {
  return status === 'PENDING';
}

/**
 * Get all valid transitions from a given task status
 */
export function getValidTaskTransitions(from: TaskStatus): TaskStatus[] {
  return VALID_TRANSITIONS[from] || [];
}
