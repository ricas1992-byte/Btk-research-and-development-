/**
 * PhaseService Tests
 * Section 4.2: S2 Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhaseService } from '../../../src/domain/services/PhaseService.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDatabase, initDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('PhaseService', () => {
  let service: PhaseService;
  let repository: PhaseRepository;

  beforeEach(() => {
    initDatabase({ path: ':memory:' });
    repository = new PhaseRepository(getDatabase());
    service = new PhaseService(repository);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createPhase', () => {
    it('should create new phase when no active phase exists', () => {
      const phase = service.createPhase({
        name: 'Test Phase',
        description: 'Test Description',
      });

      expect(phase.id).toBeDefined();
      expect(phase.name).toBe('Test Phase');
      expect(phase.description).toBe('Test Description');
      expect(phase.status).toBe('ACTIVE');
    });

    it('should throw error when active phase already exists (ENF-01)', () => {
      service.createPhase({
        name: 'Phase 1',
        description: 'Description 1',
      });

      expect(() =>
        service.createPhase({
          name: 'Phase 2',
          description: 'Description 2',
        })
      ).toThrow('Cannot create phase: Active phase already exists (ENF-01)');
    });

    it('should allow creating new phase after completing previous', () => {
      const phase1 = service.createPhase({
        name: 'Phase 1',
        description: 'Description 1',
      });

      service.completePhase(phase1.id);

      const phase2 = service.createPhase({
        name: 'Phase 2',
        description: 'Description 2',
      });

      expect(phase2.id).toBeDefined();
      expect(phase2.status).toBe('ACTIVE');
    });

    it('should allow creating new phase after abandoning previous', () => {
      const phase1 = service.createPhase({
        name: 'Phase 1',
        description: 'Description 1',
      });

      service.abandonPhase(phase1.id);

      const phase2 = service.createPhase({
        name: 'Phase 2',
        description: 'Description 2',
      });

      expect(phase2.id).toBeDefined();
      expect(phase2.status).toBe('ACTIVE');
    });
  });

  describe('getPhase', () => {
    it('should retrieve phase by id', () => {
      const created = service.createPhase({
        name: 'Test Phase',
        description: 'Description',
      });

      const retrieved = service.getPhase(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe('Test Phase');
    });

    it('should return null for non-existent phase', () => {
      const retrieved = service.getPhase('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getActivePhase', () => {
    it('should return active phase', () => {
      const created = service.createPhase({
        name: 'Active Phase',
        description: 'Description',
      });

      const active = service.getActivePhase();

      expect(active).not.toBeNull();
      expect(active!.id).toBe(created.id);
      expect(active!.status).toBe('ACTIVE');
    });

    it('should return null when no active phase exists', () => {
      const active = service.getActivePhase();

      expect(active).toBeNull();
    });

    it('should return null after completing phase', () => {
      const phase = service.createPhase({
        name: 'Phase',
        description: 'Description',
      });

      service.completePhase(phase.id);

      const active = service.getActivePhase();

      expect(active).toBeNull();
    });
  });

  describe('getAllPhases', () => {
    it('should return empty array when no phases exist', () => {
      const phases = service.getAllPhases();

      expect(phases).toEqual([]);
    });

    it('should return all phases', () => {
      const phase1 = service.createPhase({
        name: 'Phase 1',
        description: 'Description 1',
      });

      service.completePhase(phase1.id);

      const phase2 = service.createPhase({
        name: 'Phase 2',
        description: 'Description 2',
      });

      const phases = service.getAllPhases();

      expect(phases).toHaveLength(2);
      expect(phases.map((p) => p.id)).toContain(phase1.id);
      expect(phases.map((p) => p.id)).toContain(phase2.id);
    });
  });

  describe('updatePhase', () => {
    it('should update phase name', () => {
      const phase = service.createPhase({
        name: 'Original Name',
        description: 'Description',
      });

      const updated = service.updatePhase(phase.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Description');
    });

    it('should update phase description', () => {
      const phase = service.createPhase({
        name: 'Name',
        description: 'Original Description',
      });

      const updated = service.updatePhase(phase.id, { description: 'New Description' });

      expect(updated.name).toBe('Name');
      expect(updated.description).toBe('New Description');
    });

    it('should update both name and description', () => {
      const phase = service.createPhase({
        name: 'Original Name',
        description: 'Original Description',
      });

      const updated = service.updatePhase(phase.id, {
        name: 'New Name',
        description: 'New Description',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New Description');
    });

    it('should throw error for non-existent phase', () => {
      expect(() => service.updatePhase('non-existent-id', { name: 'Name' })).toThrow(
        'Phase non-existent-id not found'
      );
    });
  });

  describe('completePhase', () => {
    it('should complete active phase', () => {
      const phase = service.createPhase({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = service.completePhase(phase.id);

      expect(completed.status).toBe('COMPLETED');
      expect(completed.id).toBe(phase.id);
    });

    it('should throw error for non-existent phase', () => {
      expect(() => service.completePhase('non-existent-id')).toThrow(
        'Phase non-existent-id not found'
      );
    });

    it('should make phase terminal (cannot complete again)', () => {
      const phase = service.createPhase({
        name: 'Test Phase',
        description: 'Description',
      });

      service.completePhase(phase.id);

      expect(() => service.completePhase(phase.id)).toThrow('Cannot complete phase in');
    });
  });

  describe('abandonPhase', () => {
    it('should abandon active phase', () => {
      const phase = service.createPhase({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = service.abandonPhase(phase.id);

      expect(abandoned.status).toBe('ABANDONED');
      expect(abandoned.id).toBe(phase.id);
    });

    it('should throw error for non-existent phase', () => {
      expect(() => service.abandonPhase('non-existent-id')).toThrow(
        'Phase non-existent-id not found'
      );
    });

    it('should make phase terminal (cannot abandon again)', () => {
      const phase = service.createPhase({
        name: 'Test Phase',
        description: 'Description',
      });

      service.abandonPhase(phase.id);

      expect(() => service.abandonPhase(phase.id)).toThrow('Cannot abandon phase in');
    });
  });

  describe('ENF-01: Single active phase constraint', () => {
    it('should enforce only one active phase at a time', () => {
      service.createPhase({
        name: 'Phase 1',
        description: 'Description',
      });

      expect(() =>
        service.createPhase({
          name: 'Phase 2',
          description: 'Description',
        })
      ).toThrow('Active phase already exists (ENF-01)');
    });

    it('should allow sequential phases after completion', () => {
      const phase1 = service.createPhase({
        name: 'Phase 1',
        description: 'Description',
      });

      const active1 = service.getActivePhase();
      expect(active1?.id).toBe(phase1.id);

      service.completePhase(phase1.id);

      const phase2 = service.createPhase({
        name: 'Phase 2',
        description: 'Description',
      });

      const active2 = service.getActivePhase();
      expect(active2?.id).toBe(phase2.id);
    });
  });
});
