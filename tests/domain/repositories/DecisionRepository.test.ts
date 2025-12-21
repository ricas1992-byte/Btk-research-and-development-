/**
 * DecisionRepository Integration Tests
 * Section 4.2: S2 Repository Tests with Hash Verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DecisionRepository } from '../../../src/domain/repositories/DecisionRepository.js';
import { Decision } from '../../../src/domain/entities/Decision.js';
import { Phase } from '../../../src/domain/entities/Phase.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDatabase, initDatabase, closeDatabase } from '../../../src/db/connection.js';
import { HashVerificationError } from '../../../src/core/verification.js';

describe('DecisionRepository', () => {
  let repository: DecisionRepository;
  let testPhaseId: string;

  beforeEach(() => {
    initDatabase({ path: ':memory:' });
    repository = new DecisionRepository(getDatabase());

    const phaseRepo = new PhaseRepository(getDatabase());
    const phase = Phase.create({
      name: 'Test Phase',
      description: 'Description',
    });
    phaseRepo.create(phase);
    testPhaseId = phase.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('create', () => {
    it('should persist decision to database', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      const created = repository.create(decision);

      expect(created.id).toBe(decision.id);
      expect(created.content).toBe(decision.content);
      expect(created.content_hash).toBe(decision.content_hash);
    });

    it('should store correct hash in database', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      repository.create(decision);

      const retrieved = repository.findById(decision.id);
      expect(retrieved?.content_hash).toBe(decision.content_hash);
    });
  });

  describe('findById', () => {
    it('should retrieve decision by id', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      repository.create(decision);

      const retrieved = repository.findById(decision.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(decision.id);
      expect(retrieved!.content).toBe('Test decision');
    });

    it('should return null for non-existent id', () => {
      const retrieved = repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should verify hash on read (PROOF-07)', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      repository.create(decision);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content_hash = ? WHERE id = ?').run(
        'wrong-hash',
        decision.id
      );

      expect(() => repository.findById(decision.id)).toThrow(HashVerificationError);
    });
  });

  describe('findByPhaseId', () => {
    it('should return empty array when no decisions exist', () => {
      const decisions = repository.findByPhaseId(testPhaseId);

      expect(decisions).toEqual([]);
    });

    it('should return all decisions for phase', () => {
      const decision1 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      const decision2 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      repository.create(decision1);
      repository.create(decision2);

      const decisions = repository.findByPhaseId(testPhaseId);

      expect(decisions).toHaveLength(2);
      expect(decisions.map((d) => d.id)).toContain(decision1.id);
      expect(decisions.map((d) => d.id)).toContain(decision2.id);
    });

    it('should only return decisions for specified phase', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);

      const decisions = repository.findByPhaseId('other-phase-id');

      expect(decisions).toHaveLength(0);
    });

    it('should verify hash on all reads', () => {
      const decision1 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      const decision2 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      repository.create(decision1);
      repository.create(decision2);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content_hash = ? WHERE id = ?').run(
        'wrong-hash',
        decision1.id
      );

      expect(() => repository.findByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });
  });

  describe('findLockedByPhaseId', () => {
    it('should return only locked decisions', () => {
      const decision1 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 1',
      });

      const decision2 = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision 2',
      });

      repository.create(decision1);
      repository.create(decision2);

      const locked = decision1.lock();
      repository.update(locked);

      const lockedDecisions = repository.findLockedByPhaseId(testPhaseId);

      expect(lockedDecisions).toHaveLength(1);
      expect(lockedDecisions[0].id).toBe(decision1.id);
      expect(lockedDecisions[0].status).toBe('LOCKED');
    });

    it('should return empty array when no locked decisions exist', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Draft decision',
      });

      repository.create(decision);

      const locked = repository.findLockedByPhaseId(testPhaseId);

      expect(locked).toEqual([]);
    });

    it('should verify hash on all reads', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);

      const locked = decision.lock();
      repository.update(locked);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content_hash = ? WHERE id = ?').run(
        'wrong-hash',
        decision.id
      );

      expect(() => repository.findLockedByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });
  });

  describe('update', () => {
    it('should update decision in database', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      repository.create(decision);

      const updated = decision.updateContent('New content');
      repository.update(updated);

      const retrieved = repository.findById(decision.id);

      expect(retrieved!.content).toBe('New content');
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should recompute and store new hash', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original',
      });

      repository.create(decision);

      const originalHash = decision.content_hash;

      const updated = decision.updateContent('Updated');
      repository.update(updated);

      const retrieved = repository.findById(decision.id);

      expect(retrieved!.content_hash).not.toBe(originalHash);
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should update status', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);

      const locked = decision.lock();
      repository.update(locked);

      const retrieved = repository.findById(decision.id);

      expect(retrieved!.status).toBe('LOCKED');
    });
  });

  describe('delete', () => {
    it('should remove decision from database', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);
      repository.delete(decision.id);

      const retrieved = repository.findById(decision.id);

      expect(retrieved).toBeNull();
    });

    it('should not throw for non-existent id', () => {
      expect(() => repository.delete('non-existent-id')).not.toThrow();
    });
  });

  describe('hash verification integrity (PROOF-07)', () => {
    it('should detect corrupted content field', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Original content',
      });

      repository.create(decision);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content = ? WHERE id = ?').run(
        'Tampered content',
        decision.id
      );

      expect(() => repository.findById(decision.id)).toThrow(HashVerificationError);
    });

    it('should detect corrupted hash field', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Content',
      });

      repository.create(decision);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content_hash = ? WHERE id = ?').run(
        'corrupted-hash',
        decision.id
      );

      expect(() => repository.findById(decision.id)).toThrow(HashVerificationError);
    });

    it('should pass verification with correct data', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Test decision',
      });

      repository.create(decision);

      const retrieved = repository.findById(decision.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe('Test decision');
    });

    it('should verify on findByPhaseId', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content = ? WHERE id = ?').run('Tampered', decision.id);

      expect(() => repository.findByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });

    it('should verify on findLockedByPhaseId', () => {
      const decision = Decision.create({
        phase_id: testPhaseId,
        content: 'Decision',
      });

      repository.create(decision);

      const locked = decision.lock();
      repository.update(locked);

      const db = getDatabase();
      db.prepare('UPDATE decisions SET content = ? WHERE id = ?').run('Tampered', decision.id);

      expect(() => repository.findLockedByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });
  });
});
