/**
 * Phase State Machine Tests
 * S3: State Machine & Enforcement Layer
 * Tests all valid and invalid transitions per Section 0.5.6
 */

import { describe, it, expect } from 'vitest';
import {
  canTransitionPhase,
  validatePhaseTransition,
  isTerminalPhaseStatus,
  isActivePhaseStatus,
  getValidPhaseTransitions,
} from '../../../../src/core/state-machines/phase.js';
import type { PhaseStatus } from '../../../../src/core/types.js';

describe('Phase State Machine', () => {
  describe('Valid Transitions', () => {
    it('should allow ACTIVE → COMPLETED', () => {
      expect(canTransitionPhase('ACTIVE', 'COMPLETED')).toBe(true);
      expect(() => validatePhaseTransition('ACTIVE', 'COMPLETED')).not.toThrow();
    });

    it('should allow ACTIVE → ABANDONED', () => {
      expect(canTransitionPhase('ACTIVE', 'ABANDONED')).toBe(true);
      expect(() => validatePhaseTransition('ACTIVE', 'ABANDONED')).not.toThrow();
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject ACTIVE → ACTIVE', () => {
      expect(canTransitionPhase('ACTIVE', 'ACTIVE')).toBe(false);
      expect(() => validatePhaseTransition('ACTIVE', 'ACTIVE')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject COMPLETED → ACTIVE', () => {
      expect(canTransitionPhase('COMPLETED', 'ACTIVE')).toBe(false);
      expect(() => validatePhaseTransition('COMPLETED', 'ACTIVE')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject COMPLETED → ABANDONED', () => {
      expect(canTransitionPhase('COMPLETED', 'ABANDONED')).toBe(false);
      expect(() => validatePhaseTransition('COMPLETED', 'ABANDONED')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject COMPLETED → COMPLETED', () => {
      expect(canTransitionPhase('COMPLETED', 'COMPLETED')).toBe(false);
      expect(() => validatePhaseTransition('COMPLETED', 'COMPLETED')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject ABANDONED → ACTIVE', () => {
      expect(canTransitionPhase('ABANDONED', 'ACTIVE')).toBe(false);
      expect(() => validatePhaseTransition('ABANDONED', 'ACTIVE')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject ABANDONED → COMPLETED', () => {
      expect(canTransitionPhase('ABANDONED', 'COMPLETED')).toBe(false);
      expect(() => validatePhaseTransition('ABANDONED', 'COMPLETED')).toThrow(
        'Invalid phase transition'
      );
    });

    it('should reject ABANDONED → ABANDONED', () => {
      expect(canTransitionPhase('ABANDONED', 'ABANDONED')).toBe(false);
      expect(() => validatePhaseTransition('ABANDONED', 'ABANDONED')).toThrow(
        'Invalid phase transition'
      );
    });
  });

  describe('Terminal Status Detection', () => {
    it('should identify COMPLETED as terminal', () => {
      expect(isTerminalPhaseStatus('COMPLETED')).toBe(true);
    });

    it('should identify ABANDONED as terminal', () => {
      expect(isTerminalPhaseStatus('ABANDONED')).toBe(true);
    });

    it('should identify ACTIVE as not terminal', () => {
      expect(isTerminalPhaseStatus('ACTIVE')).toBe(false);
    });
  });

  describe('Active Status Detection', () => {
    it('should identify ACTIVE as active', () => {
      expect(isActivePhaseStatus('ACTIVE')).toBe(true);
    });

    it('should identify COMPLETED as not active', () => {
      expect(isActivePhaseStatus('COMPLETED')).toBe(false);
    });

    it('should identify ABANDONED as not active', () => {
      expect(isActivePhaseStatus('ABANDONED')).toBe(false);
    });
  });

  describe('Valid Transitions Enumeration', () => {
    it('should return COMPLETED and ABANDONED for ACTIVE', () => {
      const transitions = getValidPhaseTransitions('ACTIVE');
      expect(transitions).toEqual(expect.arrayContaining(['COMPLETED', 'ABANDONED']));
      expect(transitions).toHaveLength(2);
    });

    it('should return empty array for COMPLETED', () => {
      const transitions = getValidPhaseTransitions('COMPLETED');
      expect(transitions).toEqual([]);
    });

    it('should return empty array for ABANDONED', () => {
      const transitions = getValidPhaseTransitions('ABANDONED');
      expect(transitions).toEqual([]);
    });
  });

  describe('Error Messages', () => {
    it('should include valid transitions in error message', () => {
      expect(() => validatePhaseTransition('ACTIVE', 'ACTIVE')).toThrow(
        /Valid transitions from ACTIVE: COMPLETED, ABANDONED/
      );
    });

    it('should indicate no valid transitions for terminal states', () => {
      expect(() => validatePhaseTransition('COMPLETED', 'ACTIVE')).toThrow(
        /Valid transitions from COMPLETED: none/
      );
    });
  });

  describe('Transition Matrix Completeness', () => {
    const allStatuses: PhaseStatus[] = ['ACTIVE', 'COMPLETED', 'ABANDONED'];

    it('should have transition rules defined for all statuses', () => {
      for (const from of allStatuses) {
        for (const to of allStatuses) {
          // Should not throw - just return true or false
          expect(() => canTransitionPhase(from, to)).not.toThrow();
        }
      }
    });
  });
});
