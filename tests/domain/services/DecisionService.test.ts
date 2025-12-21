/**
 * DecisionService Tests
 * Section 4.2: S2 Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DecisionService } from '../../../src/domain/services/DecisionService.js';
import { DecisionRepository } from '../../../src/domain/repositories/DecisionRepository.js';
import { PhaseService } from '../../../src/domain/services/PhaseService.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDb, initializeDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('DecisionService', () => {
  let service: DecisionService;
  let repository: DecisionRepository;
  let phaseService: PhaseService;
  let testPhaseId: string;

  beforeEach(() => {
    initializeDatabase(':memory:');
    repository = new DecisionRepository(getDb());
    service = new DecisionService(repository);

    const phaseRepo = new PhaseRepository(getDb());
    phaseService = new PhaseService(phaseRepo);

    const phase = phaseService.createPhase({
      name: 'Test Phase',
      description: 'Test Description',
    });
    testPhaseId = phase.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createDecision', () => {
    it('should create decision with DRAFT status', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      expect(decision.id).toBeDefined();
      expect(decision.phase_id).toBe(testPhaseId);
      expect(decision.content).toBe('Test decision');
      expect(decision.status).toBe('DRAFT');
    });

    it('should allow multiple decisions for same phase', () => {
      const decision1 = service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      const decision2 = service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      expect(decision1.id).not.toBe(decision2.id);
      expect(decision1.phase_id).toBe(testPhaseId);
      expect(decision2.phase_id).toBe(testPhaseId);
    });
  });

  describe('getDecision', () => {
    it('should retrieve decision by id', () => {
      const created = service.createDecision({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      const retrieved = service.getDecision(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.content).toBe('Test decision');
    });

    it('should return null for non-existent decision', () => {
      const retrieved = service.getDecision('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getDecisionsByPhase', () => {
    it('should return empty array when no decisions exist', () => {
      const decisions = service.getDecisionsByPhase(testPhaseId);

      expect(decisions).toEqual([]);
    });

    it('should return all decisions for phase', () => {
      service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      const decisions = service.getDecisionsByPhase(testPhaseId);

      expect(decisions).toHaveLength(2);
    });

    it('should only return decisions for specified phase', () => {
      service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision for phase',
      });

      const decisions = service.getDecisionsByPhase('other-phase-id');

      expect(decisions).toHaveLength(0);
    });
  });

  describe('getLockedDecisionsByPhase', () => {
    it('should return only locked decisions', () => {
      const decision1 = service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      service.createDecision({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      service.lockDecision(decision1.id);

      const locked = service.getLockedDecisionsByPhase(testPhaseId);

      expect(locked).toHaveLength(1);
      expect(locked[0].id).toBe(decision1.id);
      expect(locked[0].status).toBe('LOCKED');
    });

    it('should return empty array when no locked decisions exist', () => {
      service.createDecision({
        phase_id: testPhaseId,
        content: 'Draft decision',
      });

      const locked = service.getLockedDecisionsByPhase(testPhaseId);

      expect(locked).toEqual([]);
    });
  });

  describe('updateDecision', () => {
    it('should update draft decision content', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const updated = service.updateDecision(decision.id, 'New content');

      expect(updated.content).toBe('New content');
      expect(updated.id).toBe(decision.id);
      expect(updated.status).toBe('DRAFT');
    });

    it('should throw error when updating locked decision (ENF-02)', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      service.lockDecision(decision.id);

      expect(() => service.updateDecision(decision.id, 'New content')).toThrow(
        'Cannot update locked decision'
      );
    });

    it('should throw error for non-existent decision', () => {
      expect(() => service.updateDecision('non-existent-id', 'Content')).toThrow(
        'Decision non-existent-id not found'
      );
    });
  });

  describe('lockDecision', () => {
    it('should lock draft decision', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Test content',
      });

      const locked = service.lockDecision(decision.id);

      expect(locked.status).toBe('LOCKED');
      expect(locked.id).toBe(decision.id);
      expect(locked.content).toBe('Test content');
    });

    it('should make decision immutable after lock', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Content',
      });

      service.lockDecision(decision.id);

      expect(() => service.updateDecision(decision.id, 'New content')).toThrow(
        'Cannot update locked decision'
      );
    });

    it('should throw error when locking already locked decision', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Content',
      });

      service.lockDecision(decision.id);

      expect(() => service.lockDecision(decision.id)).toThrow('Decision is already locked');
    });

    it('should throw error for non-existent decision', () => {
      expect(() => service.lockDecision('non-existent-id')).toThrow(
        'Decision non-existent-id not found'
      );
    });
  });

  describe('deleteDecision', () => {
    it('should delete draft decision', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Test content',
      });

      service.deleteDecision(decision.id);

      const retrieved = service.getDecision(decision.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error when deleting locked decision (ENF-02)', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Test content',
      });

      service.lockDecision(decision.id);

      expect(() => service.deleteDecision(decision.id)).toThrow(
        'Cannot delete locked decision (ENF-02)'
      );
    });

    it('should throw error for non-existent decision', () => {
      expect(() => service.deleteDecision('non-existent-id')).toThrow(
        'Decision non-existent-id not found'
      );
    });
  });

  describe('ENF-02: Decision immutability enforcement', () => {
    it('should prevent all modifications after lock', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const locked = service.lockDecision(decision.id);

      expect(() => service.updateDecision(locked.id, 'New content')).toThrow();
      expect(() => service.lockDecision(locked.id)).toThrow();
      expect(() => service.deleteDecision(locked.id)).toThrow();
    });

    it('should allow updates before lock', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Original',
      });

      const updated1 = service.updateDecision(decision.id, 'Updated 1');
      expect(updated1.content).toBe('Updated 1');

      const updated2 = service.updateDecision(decision.id, 'Updated 2');
      expect(updated2.content).toBe('Updated 2');

      const locked = service.lockDecision(decision.id);
      expect(() => service.updateDecision(locked.id, 'Updated 3')).toThrow();
    });

    it('should preserve content hash after lock', () => {
      const decision = service.createDecision({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const originalHash = decision.content_hash;

      const locked = service.lockDecision(decision.id);

      expect(locked.content_hash).toBe(originalHash);
    });
  });
});
