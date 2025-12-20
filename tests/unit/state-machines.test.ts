import { describe, it, expect } from 'vitest';
import {
  canTransitionIdea,
  validateIdeaTransition,
  isTerminalIdeaStatus,
} from '../../src/core/state-machines/idea.js';
import {
  canTransitionPhase,
  validatePhaseTransition,
  isTerminalPhaseStatus,
} from '../../src/core/state-machines/phase.js';
import {
  canTransitionDecision,
  validateDecisionTransition,
  isTerminalDecisionStatus,
  isDecisionMutable,
} from '../../src/core/state-machines/decision.js';
import {
  canTransitionTask,
  validateTaskTransition,
  isTerminalTaskStatus,
} from '../../src/core/state-machines/task.js';
import { InvalidStateTransitionError } from '../../src/types/errors.js';

describe('Idea State Machine', () => {
  it('allows PARKED -> PROMOTED', () => {
    expect(canTransitionIdea('PARKED', 'PROMOTED')).toBe(true);
    expect(() => validateIdeaTransition('PARKED', 'PROMOTED')).not.toThrow();
  });

  it('allows PARKED -> ABANDONED', () => {
    expect(canTransitionIdea('PARKED', 'ABANDONED')).toBe(true);
    expect(() => validateIdeaTransition('PARKED', 'ABANDONED')).not.toThrow();
  });

  it('rejects PROMOTED -> ABANDONED', () => {
    expect(canTransitionIdea('PROMOTED', 'ABANDONED')).toBe(false);
    expect(() => validateIdeaTransition('PROMOTED', 'ABANDONED')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects ABANDONED -> PROMOTED', () => {
    expect(canTransitionIdea('ABANDONED', 'PROMOTED')).toBe(false);
    expect(() => validateIdeaTransition('ABANDONED', 'PROMOTED')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('identifies terminal states', () => {
    expect(isTerminalIdeaStatus('PARKED')).toBe(false);
    expect(isTerminalIdeaStatus('PROMOTED')).toBe(true);
    expect(isTerminalIdeaStatus('ABANDONED')).toBe(true);
  });
});

describe('Phase State Machine', () => {
  it('allows ACTIVE -> CLOSED', () => {
    expect(canTransitionPhase('ACTIVE', 'CLOSED')).toBe(true);
    expect(() => validatePhaseTransition('ACTIVE', 'CLOSED')).not.toThrow();
  });

  it('rejects CLOSED -> ACTIVE', () => {
    expect(canTransitionPhase('CLOSED', 'ACTIVE')).toBe(false);
    expect(() => validatePhaseTransition('CLOSED', 'ACTIVE')).toThrow(InvalidStateTransitionError);
  });

  it('identifies terminal states', () => {
    expect(isTerminalPhaseStatus('ACTIVE')).toBe(false);
    expect(isTerminalPhaseStatus('CLOSED')).toBe(true);
  });
});

describe('Decision State Machine', () => {
  it('allows DRAFT -> LOCKED', () => {
    expect(canTransitionDecision('DRAFT', 'LOCKED')).toBe(true);
    expect(() => validateDecisionTransition('DRAFT', 'LOCKED')).not.toThrow();
  });

  it('rejects LOCKED -> DRAFT', () => {
    expect(canTransitionDecision('LOCKED', 'DRAFT')).toBe(false);
    expect(() => validateDecisionTransition('LOCKED', 'DRAFT')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('identifies terminal states', () => {
    expect(isTerminalDecisionStatus('DRAFT')).toBe(false);
    expect(isTerminalDecisionStatus('LOCKED')).toBe(true);
  });

  it('identifies mutable states', () => {
    expect(isDecisionMutable('DRAFT')).toBe(true);
    expect(isDecisionMutable('LOCKED')).toBe(false);
  });
});

describe('Task State Machine', () => {
  it('allows PENDING -> COMPLETED', () => {
    expect(canTransitionTask('PENDING', 'COMPLETED')).toBe(true);
    expect(() => validateTaskTransition('PENDING', 'COMPLETED')).not.toThrow();
  });

  it('allows PENDING -> VOIDED', () => {
    expect(canTransitionTask('PENDING', 'VOIDED')).toBe(true);
    expect(() => validateTaskTransition('PENDING', 'VOIDED')).not.toThrow();
  });

  it('rejects COMPLETED -> VOIDED', () => {
    expect(canTransitionTask('COMPLETED', 'VOIDED')).toBe(false);
    expect(() => validateTaskTransition('COMPLETED', 'VOIDED')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects VOIDED -> COMPLETED', () => {
    expect(canTransitionTask('VOIDED', 'COMPLETED')).toBe(false);
    expect(() => validateTaskTransition('VOIDED', 'COMPLETED')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('identifies terminal states', () => {
    expect(isTerminalTaskStatus('PENDING')).toBe(false);
    expect(isTerminalTaskStatus('COMPLETED')).toBe(true);
    expect(isTerminalTaskStatus('VOIDED')).toBe(true);
  });
});
