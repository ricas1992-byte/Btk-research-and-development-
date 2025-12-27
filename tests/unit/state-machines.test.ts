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
    expect(() => validateIdeaTransition('PROMOTED', 'ABANDONED')).toThrow();
  });

  it('rejects ABANDONED -> PROMOTED', () => {
    expect(canTransitionIdea('ABANDONED', 'PROMOTED')).toBe(false);
    expect(() => validateIdeaTransition('ABANDONED', 'PROMOTED')).toThrow();
  });

  it('identifies terminal states', () => {
    expect(isTerminalIdeaStatus('PARKED')).toBe(false);
    expect(isTerminalIdeaStatus('PROMOTED')).toBe(true);
    expect(isTerminalIdeaStatus('ABANDONED')).toBe(true);
  });
});

describe('Phase State Machine', () => {
  it('allows ACTIVE -> COMPLETED', () => {
    expect(canTransitionPhase('ACTIVE', 'COMPLETED')).toBe(true);
    expect(() => validatePhaseTransition('ACTIVE', 'COMPLETED')).not.toThrow();
  });

  it('allows ACTIVE -> ABANDONED', () => {
    expect(canTransitionPhase('ACTIVE', 'ABANDONED')).toBe(true);
    expect(() => validatePhaseTransition('ACTIVE', 'ABANDONED')).not.toThrow();
  });

  it('rejects COMPLETED -> ACTIVE', () => {
    expect(canTransitionPhase('COMPLETED', 'ACTIVE')).toBe(false);
    expect(() => validatePhaseTransition('COMPLETED', 'ACTIVE')).toThrow();
  });

  it('identifies terminal states', () => {
    expect(isTerminalPhaseStatus('ACTIVE')).toBe(false);
    expect(isTerminalPhaseStatus('COMPLETED')).toBe(true);
    expect(isTerminalPhaseStatus('ABANDONED')).toBe(true);
  });
});

describe('Decision State Machine', () => {
  it('allows DRAFT -> LOCKED', () => {
    expect(canTransitionDecision('DRAFT', 'LOCKED')).toBe(true);
    expect(() => validateDecisionTransition('DRAFT', 'LOCKED')).not.toThrow();
  });

  it('rejects LOCKED -> DRAFT', () => {
    expect(canTransitionDecision('LOCKED', 'DRAFT')).toBe(false);
    expect(() => validateDecisionTransition('LOCKED', 'DRAFT')).toThrow();
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
  it('allows PENDING -> IN_PROGRESS', () => {
    expect(canTransitionTask('PENDING', 'IN_PROGRESS')).toBe(true);
    expect(() => validateTaskTransition('PENDING', 'IN_PROGRESS')).not.toThrow();
  });

  it('allows PENDING -> CANCELLED', () => {
    expect(canTransitionTask('PENDING', 'CANCELLED')).toBe(true);
    expect(() => validateTaskTransition('PENDING', 'CANCELLED')).not.toThrow();
  });

  it('allows IN_PROGRESS -> COMPLETED', () => {
    expect(canTransitionTask('IN_PROGRESS', 'COMPLETED')).toBe(true);
    expect(() => validateTaskTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
  });

  it('rejects PENDING -> COMPLETED', () => {
    expect(canTransitionTask('PENDING', 'COMPLETED')).toBe(false);
    expect(() => validateTaskTransition('PENDING', 'COMPLETED')).toThrow();
  });

  it('rejects COMPLETED -> CANCELLED', () => {
    expect(canTransitionTask('COMPLETED', 'CANCELLED')).toBe(false);
    expect(() => validateTaskTransition('COMPLETED', 'CANCELLED')).toThrow();
  });

  it('identifies terminal states', () => {
    expect(isTerminalTaskStatus('PENDING')).toBe(false);
    expect(isTerminalTaskStatus('IN_PROGRESS')).toBe(false);
    expect(isTerminalTaskStatus('COMPLETED')).toBe(true);
    expect(isTerminalTaskStatus('CANCELLED')).toBe(true);
  });
});
