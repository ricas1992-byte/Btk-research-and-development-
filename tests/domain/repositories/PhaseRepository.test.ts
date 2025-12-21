/**
 * PhaseRepository Integration Tests
 * Section 4.2: S2 Repository Tests with Hash Verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { Phase } from '../../../src/domain/entities/Phase.js';
import { getDb, initializeDatabase, closeDatabase } from '../../../src/db/connection.js';
import { HashVerificationError } from '../../../src/core/verification.js';

describe('PhaseRepository', () => {
  let repository: PhaseRepository;

  beforeEach(() => {
    initializeDatabase(':memory:');
    repository = new PhaseRepository(getDb());
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('create', () => {
    it('should persist phase to database', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const created = repository.create(phase);

      expect(created.id).toBe(phase.id);
      expect(created.name).toBe(phase.name);
      expect(created.content_hash).toBe(phase.content_hash);
    });

    it('should store correct hash in database', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      repository.create(phase);

      const retrieved = repository.findById(phase.id);
      expect(retrieved?.content_hash).toBe(phase.content_hash);
    });
  });

  describe('findById', () => {
    it('should retrieve phase by id', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      repository.create(phase);

      const retrieved = repository.findById(phase.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(phase.id);
      expect(retrieved!.name).toBe('Test Phase');
    });

    it('should return null for non-existent id', () => {
      const retrieved = repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should verify hash on read (PROOF-07)', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      repository.create(phase);

      const db = getDb();
      const wrongHash = 'wrong-hash-value';
      db.prepare('UPDATE phases SET content_hash = ? WHERE id = ?').run(wrongHash, phase.id);

      expect(() => repository.findById(phase.id)).toThrow(HashVerificationError);
    });

    it('should include error details in hash mismatch (PROOF-07)', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      repository.create(phase);

      const db = getDb();
      db.prepare('UPDATE phases SET content_hash = ? WHERE id = ?').run('wrong-hash', phase.id);

      try {
        repository.findById(phase.id);
        expect.fail('Should have thrown HashVerificationError');
      } catch (error) {
        expect(error).toBeInstanceOf(HashVerificationError);
        const hashError = error as HashVerificationError;
        expect(hashError.entityType).toBe('Phase');
        expect(hashError.entityId).toBe(phase.id);
        expect(hashError.message).toContain('HARD STOP');
      }
    });
  });

  describe('findActive', () => {
    it('should return active phase', () => {
      const phase = Phase.create({
        name: 'Active Phase',
        description: 'Description',
      });

      repository.create(phase);

      const active = repository.findActive();

      expect(active).not.toBeNull();
      expect(active!.id).toBe(phase.id);
      expect(active!.status).toBe('ACTIVE');
    });

    it('should return null when no active phase exists', () => {
      const active = repository.findActive();

      expect(active).toBeNull();
    });

    it('should return null after phase is completed', () => {
      const phase = Phase.create({
        name: 'Phase',
        description: 'Description',
      });

      repository.create(phase);

      const completed = phase.complete();
      repository.update(completed);

      const active = repository.findActive();

      expect(active).toBeNull();
    });

    it('should verify hash on read', () => {
      const phase = Phase.create({
        name: 'Phase',
        description: 'Description',
      });

      repository.create(phase);

      const db = getDb();
      db.prepare('UPDATE phases SET content_hash = ? WHERE id = ?').run('wrong-hash', phase.id);

      expect(() => repository.findActive()).toThrow(HashVerificationError);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no phases exist', () => {
      const phases = repository.findAll();

      expect(phases).toEqual([]);
    });

    it('should return all phases', () => {
      const phase1 = Phase.create({
        name: 'Phase 1',
        description: 'Description 1',
      });

      repository.create(phase1);

      const completed = phase1.complete();
      repository.update(completed);

      const phase2 = Phase.create({
        name: 'Phase 2',
        description: 'Description 2',
      });

      repository.create(phase2);

      const phases = repository.findAll();

      expect(phases).toHaveLength(2);
    });

    it('should verify hash on all reads', () => {
      const phase1 = Phase.create({
        name: 'Phase 1',
        description: 'Description',
      });

      const phase2 = Phase.create({
        name: 'Phase 2',
        description: 'Description',
      });

      repository.create(phase1);
      repository.update(phase1.complete());
      repository.create(phase2);

      const db = getDb();
      db.prepare('UPDATE phases SET content_hash = ? WHERE id = ?').run('wrong-hash', phase1.id);

      expect(() => repository.findAll()).toThrow(HashVerificationError);
    });
  });

  describe('update', () => {
    it('should update phase in database', () => {
      const phase = Phase.create({
        name: 'Original Name',
        description: 'Description',
      });

      repository.create(phase);

      const updated = phase.update({ name: 'New Name' });
      repository.update(updated);

      const retrieved = repository.findById(phase.id);

      expect(retrieved!.name).toBe('New Name');
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should recompute and store new hash', () => {
      const phase = Phase.create({
        name: 'Original',
        description: 'Description',
      });

      repository.create(phase);

      const originalHash = phase.content_hash;

      const updated = phase.update({ name: 'Updated' });
      repository.update(updated);

      const retrieved = repository.findById(phase.id);

      expect(retrieved!.content_hash).not.toBe(originalHash);
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should update status', () => {
      const phase = Phase.create({
        name: 'Phase',
        description: 'Description',
      });

      repository.create(phase);

      const completed = phase.complete();
      repository.update(completed);

      const retrieved = repository.findById(phase.id);

      expect(retrieved!.status).toBe('COMPLETED');
    });
  });

  describe('hasActivePhase', () => {
    it('should return false when no phases exist', () => {
      const hasActive = repository.hasActivePhase();

      expect(hasActive).toBe(false);
    });

    it('should return true when active phase exists', () => {
      const phase = Phase.create({
        name: 'Active Phase',
        description: 'Description',
      });

      repository.create(phase);

      const hasActive = repository.hasActivePhase();

      expect(hasActive).toBe(true);
    });

    it('should return false after completing phase', () => {
      const phase = Phase.create({
        name: 'Phase',
        description: 'Description',
      });

      repository.create(phase);

      const completed = phase.complete();
      repository.update(completed);

      const hasActive = repository.hasActivePhase();

      expect(hasActive).toBe(false);
    });
  });

  describe('hash verification integrity (PROOF-07)', () => {
    it('should detect corrupted name field', () => {
      const phase = Phase.create({
        name: 'Original Name',
        description: 'Description',
      });

      repository.create(phase);

      const db = getDb();
      db.prepare('UPDATE phases SET name = ? WHERE id = ?').run('Tampered Name', phase.id);

      expect(() => repository.findById(phase.id)).toThrow(HashVerificationError);
    });

    it('should detect corrupted description field', () => {
      const phase = Phase.create({
        name: 'Name',
        description: 'Original Description',
      });

      repository.create(phase);

      const db = getDb();
      db.prepare('UPDATE phases SET description = ? WHERE id = ?').run(
        'Tampered Description',
        phase.id
      );

      expect(() => repository.findById(phase.id)).toThrow(HashVerificationError);
    });

    it('should pass verification with correct data', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Test Description',
      });

      repository.create(phase);

      const retrieved = repository.findById(phase.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Phase');
    });
  });
});
