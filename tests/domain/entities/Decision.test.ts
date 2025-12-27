/**
 * Decision Entity Tests
 * Section 4.2: S2 Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { Decision } from '../../../src/domain/entities/Decision.js';
import { computeDecisionHash } from '../../../src/core/hash.js';

describe('Decision Entity', () => {
  const testPhaseId = 'phase-123';

  describe('factory method', () => {
    it('should create decision with DRAFT status', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision content',
      });

      expect(decision.id).toBeDefined();
      expect(decision.phase_id).toBe(testPhaseId);
      expect(decision.content).toBe('Test decision content');
      expect(decision.status).toBe('DRAFT');
      expect(decision.created_at).toBeDefined();
      expect(decision.locked_at).toBeNull();
      expect(decision.content_hash).toBeDefined();
    });

    it('should compute correct hash on creation', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision content',
      });

      const expectedHash = computeDecisionHash(testPhaseId, 'Test decision content');
      expect(decision.content_hash).toBe(expectedHash);
    });
  });

  describe('updateContent method', () => {
    it('should update content when DRAFT', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const updated = decision.updateContent('New content');

      expect(updated.content).toBe('New content');
      expect(updated.id).toBe(decision.id);
      expect(updated.phase_id).toBe(testPhaseId);
      expect(updated.status).toBe('DRAFT');
    });

    it('should recompute hash when content updated', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const updated = decision.updateContent('New content');

      expect(updated.content_hash).not.toBe(decision.content_hash);

      const expectedHash = computeDecisionHash(testPhaseId, 'New content');
      expect(updated.content_hash).toBe(expectedHash);
    });

    it('should throw error when LOCKED (ENF-02)', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const locked = decision.lock();

      expect(() => locked.updateContent('New content')).toThrow(
        'Cannot update locked decision (ENF-02: Decision immutability)'
      );
    });

    it('should return new instance (immutability)', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original',
      });

      const updated = decision.updateContent('Updated');

      expect(updated).not.toBe(decision);
      expect(decision.content).toBe('Original');
      expect(updated.content).toBe('Updated');
    });
  });

  describe('lock method', () => {
    it('should transition DRAFT to LOCKED', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(locked.status).toBe('LOCKED');
      expect(locked.id).toBe(decision.id);
      expect(locked.content).toBe(decision.content);
    });

    it('should throw if already LOCKED', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(() => locked.lock()).toThrow('Decision is already locked');
    });

    it('should return new instance (immutability)', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(locked).not.toBe(decision);
      expect(decision.status).toBe('DRAFT');
      expect(locked.status).toBe('LOCKED');
    });

    it('should make decision immutable after lock', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(() => locked.updateContent('New')).toThrow('Cannot update locked decision');
    });
  });

  describe('isLocked method', () => {
    it('should return false for DRAFT decision', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      expect(decision.isLocked()).toBe(false);
    });

    it('should return true for LOCKED decision', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(locked.isLocked()).toBe(true);
    });
  });

  describe('fromDatabase method', () => {
    it('should reconstruct decision from database row', () => {
      const dbRow = {
        id: 'test-id',
        phase_id: testPhaseId,
        content: 'Test content',
        status: 'DRAFT' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        content_hash: 'test-hash',
        locked_at: null,
      };

      const decision = Decision.fromDatabase(dbRow);

      expect(decision.id).toBe('test-id');
      expect(decision.phase_id).toBe(testPhaseId);
      expect(decision.content).toBe('Test content');
      expect(decision.status).toBe('DRAFT');
      expect(decision.content_hash).toBe('test-hash');
    });
  });

  describe('ENF-02: Decision immutability enforcement', () => {
    it('should prevent all modifications after lock', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      const locked = decision.lock();

      expect(() => locked.updateContent('New content')).toThrow();
      expect(() => locked.lock()).toThrow();
    });

    it('should preserve content hash after lock', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      const locked = decision.lock();

      expect(locked.content_hash).toBe(decision.content_hash);
    });
  });
});
