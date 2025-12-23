/**
 * Decision State Machine Tests
 * S3: State Machine & Enforcement Layer
 * Tests all valid and invalid transitions per Section 0.5.6
 */

import { describe, it, expect } from 'vitest';
import {
  canTransitionDecision,
  validateDecisionTransition,
  isTerminalDecisionStatus,
  isDecisionMutable,
  isDecisionLocked,
  getValidDecisionTransitions,
} from '../../../../src/core/state-machines/decision.js';
import type { DecisionStatus } from '../../../../src/core/types.js';

describe('Decision State Machine', () => {
  describe('Valid Transitions', () => {
    it('should allow DRAFT → LOCKED', () => {
      expect(canTransitionDecision('DRAFT', 'LOCKED')).toBe(true);
      expect(() => validateDecisionTransition('DRAFT', 'LOCKED')).not.toThrow();
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject DRAFT → DRAFT', () => {
      expect(canTransitionDecision('DRAFT', 'DRAFT')).toBe(false);
      expect(() => validateDecisionTransition('DRAFT', 'DRAFT')).toThrow(
        'Invalid decision transition'
      );
    });

    it('should reject LOCKED → DRAFT', () => {
      expect(canTransitionDecision('LOCKED', 'DRAFT')).toBe(false);
      expect(() => validateDecisionTransition('LOCKED', 'DRAFT')).toThrow(
        'Invalid decision transition'
      );
    });

    it('should reject LOCKED → LOCKED', () => {
      expect(canTransitionDecision('LOCKED', 'LOCKED')).toBe(false);
      expect(() => validateDecisionTransition('LOCKED', 'LOCKED')).toThrow(
        'Invalid decision transition'
      );
    });
  });

  describe('Terminal Status Detection', () => {
    it('should identify LOCKED as terminal', () => {
      expect(isTerminalDecisionStatus('LOCKED')).toBe(true);
    });

    it('should identify DRAFT as not terminal', () => {
      expect(isTerminalDecisionStatus('DRAFT')).toBe(false);
    });
  });

  describe('Mutability Detection (ENF-02)', () => {
    it('should identify DRAFT as mutable', () => {
      expect(isDecisionMutable('DRAFT')).toBe(true);
    });

    it('should identify LOCKED as not mutable', () => {
      expect(isDecisionMutable('LOCKED')).toBe(false);
    });
  });

  describe('Locked Status Detection', () => {
    it('should identify LOCKED status', () => {
      expect(isDecisionLocked('LOCKED')).toBe(true);
    });

    it('should identify DRAFT as not locked', () => {
      expect(isDecisionLocked('DRAFT')).toBe(false);
    });
  });

  describe('Valid Transitions Enumeration', () => {
    it('should return LOCKED for DRAFT', () => {
      const transitions = getValidDecisionTransitions('DRAFT');
      expect(transitions).toEqual(['LOCKED']);
    });

    it('should return empty array for LOCKED', () => {
      const transitions = getValidDecisionTransitions('LOCKED');
      expect(transitions).toEqual([]);
    });
  });

  describe('Immutability Guarantee', () => {
    it('should enforce that LOCKED has no valid transitions', () => {
      const allStatuses: DecisionStatus[] = ['DRAFT', 'LOCKED'];

      for (const to of allStatuses) {
        expect(canTransitionDecision('LOCKED', to)).toBe(false);
      }
    });

    it('should prevent any state change from LOCKED', () => {
      const allStatuses: DecisionStatus[] = ['DRAFT', 'LOCKED'];

      for (const to of allStatuses) {
        expect(() => validateDecisionTransition('LOCKED', to)).toThrow(
          'Invalid decision transition'
        );
      }
    });
  });

  describe('Error Messages', () => {
    it('should include valid transitions in error message', () => {
      expect(() => validateDecisionTransition('DRAFT', 'DRAFT')).toThrow(
        /Valid transitions from DRAFT: LOCKED/
      );
    });

    it('should indicate no valid transitions for LOCKED state', () => {
      expect(() => validateDecisionTransition('LOCKED', 'DRAFT')).toThrow(
        /Valid transitions from LOCKED: none/
      );
    });
  });

  describe('Transition Matrix Completeness', () => {
    const allStatuses: DecisionStatus[] = ['DRAFT', 'LOCKED'];

    it('should have transition rules defined for all statuses', () => {
      for (const from of allStatuses) {
        for (const to of allStatuses) {
          // Should not throw - just return true or false
          expect(() => canTransitionDecision(from, to)).not.toThrow();
        }
      }
    });
  });

  describe('Lock is Irreversible', () => {
    it('should not allow unlocking a decision', () => {
      expect(canTransitionDecision('LOCKED', 'DRAFT')).toBe(false);
    });

    it('should throw error when attempting to unlock', () => {
      expect(() => validateDecisionTransition('LOCKED', 'DRAFT')).toThrow();
    });
  });
});
