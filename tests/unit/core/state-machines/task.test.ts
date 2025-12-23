/**
 * Task State Machine Tests
 * S3: State Machine & Enforcement Layer
 * Tests all valid and invalid transitions per Section 0.5.6
 */

import { describe, it, expect } from 'vitest';
import {
  canTransitionTask,
  validateTaskTransition,
  isTerminalTaskStatus,
  isTaskInProgress,
  isTaskPending,
  getValidTaskTransitions,
} from '../../../../src/core/state-machines/task.js';
import type { TaskStatus } from '../../../../src/core/types.js';

describe('Task State Machine', () => {
  describe('Valid Transitions', () => {
    it('should allow PENDING → IN_PROGRESS', () => {
      expect(canTransitionTask('PENDING', 'IN_PROGRESS')).toBe(true);
      expect(() => validateTaskTransition('PENDING', 'IN_PROGRESS')).not.toThrow();
    });

    it('should allow PENDING → CANCELLED', () => {
      expect(canTransitionTask('PENDING', 'CANCELLED')).toBe(true);
      expect(() => validateTaskTransition('PENDING', 'CANCELLED')).not.toThrow();
    });

    it('should allow IN_PROGRESS → COMPLETED', () => {
      expect(canTransitionTask('IN_PROGRESS', 'COMPLETED')).toBe(true);
      expect(() => validateTaskTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
    });

    it('should allow IN_PROGRESS → PENDING (pause)', () => {
      expect(canTransitionTask('IN_PROGRESS', 'PENDING')).toBe(true);
      expect(() => validateTaskTransition('IN_PROGRESS', 'PENDING')).not.toThrow();
    });

    it('should allow IN_PROGRESS → CANCELLED', () => {
      expect(canTransitionTask('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(() => validateTaskTransition('IN_PROGRESS', 'CANCELLED')).not.toThrow();
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject PENDING → COMPLETED', () => {
      expect(canTransitionTask('PENDING', 'COMPLETED')).toBe(false);
      expect(() => validateTaskTransition('PENDING', 'COMPLETED')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject PENDING → PENDING', () => {
      expect(canTransitionTask('PENDING', 'PENDING')).toBe(false);
      expect(() => validateTaskTransition('PENDING', 'PENDING')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject IN_PROGRESS → IN_PROGRESS', () => {
      expect(canTransitionTask('IN_PROGRESS', 'IN_PROGRESS')).toBe(false);
      expect(() => validateTaskTransition('IN_PROGRESS', 'IN_PROGRESS')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject COMPLETED → PENDING', () => {
      expect(canTransitionTask('COMPLETED', 'PENDING')).toBe(false);
      expect(() => validateTaskTransition('COMPLETED', 'PENDING')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject COMPLETED → IN_PROGRESS', () => {
      expect(canTransitionTask('COMPLETED', 'IN_PROGRESS')).toBe(false);
      expect(() => validateTaskTransition('COMPLETED', 'IN_PROGRESS')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject COMPLETED → CANCELLED', () => {
      expect(canTransitionTask('COMPLETED', 'CANCELLED')).toBe(false);
      expect(() => validateTaskTransition('COMPLETED', 'CANCELLED')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject COMPLETED → COMPLETED', () => {
      expect(canTransitionTask('COMPLETED', 'COMPLETED')).toBe(false);
      expect(() => validateTaskTransition('COMPLETED', 'COMPLETED')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject CANCELLED → PENDING', () => {
      expect(canTransitionTask('CANCELLED', 'PENDING')).toBe(false);
      expect(() => validateTaskTransition('CANCELLED', 'PENDING')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject CANCELLED → IN_PROGRESS', () => {
      expect(canTransitionTask('CANCELLED', 'IN_PROGRESS')).toBe(false);
      expect(() => validateTaskTransition('CANCELLED', 'IN_PROGRESS')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject CANCELLED → COMPLETED', () => {
      expect(canTransitionTask('CANCELLED', 'COMPLETED')).toBe(false);
      expect(() => validateTaskTransition('CANCELLED', 'COMPLETED')).toThrow(
        'Invalid task transition'
      );
    });

    it('should reject CANCELLED → CANCELLED', () => {
      expect(canTransitionTask('CANCELLED', 'CANCELLED')).toBe(false);
      expect(() => validateTaskTransition('CANCELLED', 'CANCELLED')).toThrow(
        'Invalid task transition'
      );
    });
  });

  describe('Terminal Status Detection', () => {
    it('should identify COMPLETED as terminal', () => {
      expect(isTerminalTaskStatus('COMPLETED')).toBe(true);
    });

    it('should identify CANCELLED as terminal', () => {
      expect(isTerminalTaskStatus('CANCELLED')).toBe(true);
    });

    it('should identify PENDING as not terminal', () => {
      expect(isTerminalTaskStatus('PENDING')).toBe(false);
    });

    it('should identify IN_PROGRESS as not terminal', () => {
      expect(isTerminalTaskStatus('IN_PROGRESS')).toBe(false);
    });
  });

  describe('Status Detection Helpers', () => {
    it('should identify IN_PROGRESS status', () => {
      expect(isTaskInProgress('IN_PROGRESS')).toBe(true);
      expect(isTaskInProgress('PENDING')).toBe(false);
      expect(isTaskInProgress('COMPLETED')).toBe(false);
      expect(isTaskInProgress('CANCELLED')).toBe(false);
    });

    it('should identify PENDING status', () => {
      expect(isTaskPending('PENDING')).toBe(true);
      expect(isTaskPending('IN_PROGRESS')).toBe(false);
      expect(isTaskPending('COMPLETED')).toBe(false);
      expect(isTaskPending('CANCELLED')).toBe(false);
    });
  });

  describe('Valid Transitions Enumeration', () => {
    it('should return IN_PROGRESS and CANCELLED for PENDING', () => {
      const transitions = getValidTaskTransitions('PENDING');
      expect(transitions).toEqual(expect.arrayContaining(['IN_PROGRESS', 'CANCELLED']));
      expect(transitions).toHaveLength(2);
    });

    it('should return COMPLETED, PENDING, and CANCELLED for IN_PROGRESS', () => {
      const transitions = getValidTaskTransitions('IN_PROGRESS');
      expect(transitions).toEqual(
        expect.arrayContaining(['COMPLETED', 'PENDING', 'CANCELLED'])
      );
      expect(transitions).toHaveLength(3);
    });

    it('should return empty array for COMPLETED', () => {
      const transitions = getValidTaskTransitions('COMPLETED');
      expect(transitions).toEqual([]);
    });

    it('should return empty array for CANCELLED', () => {
      const transitions = getValidTaskTransitions('CANCELLED');
      expect(transitions).toEqual([]);
    });
  });

  describe('Pause Functionality', () => {
    it('should allow pausing IN_PROGRESS task back to PENDING', () => {
      expect(canTransitionTask('IN_PROGRESS', 'PENDING')).toBe(true);
      expect(() => validateTaskTransition('IN_PROGRESS', 'PENDING')).not.toThrow();
    });

    it('should not allow pausing from other statuses', () => {
      expect(canTransitionTask('COMPLETED', 'PENDING')).toBe(false);
      expect(canTransitionTask('CANCELLED', 'PENDING')).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should include valid transitions in error message', () => {
      expect(() => validateTaskTransition('PENDING', 'COMPLETED')).toThrow(
        /Valid transitions from PENDING: IN_PROGRESS, CANCELLED/
      );
    });

    it('should indicate no valid transitions for terminal states', () => {
      expect(() => validateTaskTransition('COMPLETED', 'PENDING')).toThrow(
        /Valid transitions from COMPLETED: none/
      );
    });
  });

  describe('Transition Matrix Completeness', () => {
    const allStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    it('should have transition rules defined for all statuses', () => {
      for (const from of allStatuses) {
        for (const to of allStatuses) {
          // Should not throw - just return true or false
          expect(() => canTransitionTask(from, to)).not.toThrow();
        }
      }
    });
  });
});
