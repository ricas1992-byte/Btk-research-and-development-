/**
 * ParkingLotService Tests
 * Section 4.2: S2 Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParkingLotService } from '../../../src/domain/services/ParkingLotService.js';
import { ParkingLotRepository } from '../../../src/domain/repositories/ParkingLotRepository.js';
import { getDatabase, initDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('ParkingLotService', () => {
  let service: ParkingLotService;
  let repository: ParkingLotRepository;

  beforeEach(() => {
    initDatabase({ path: ':memory:' });
    repository = new ParkingLotRepository(getDatabase());
    service = new ParkingLotService(repository);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createEntry', () => {
    it('should create entry with content', () => {
      const entry = service.createEntry({
        content: 'Test parking lot item',
      });

      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Test parking lot item');
      expect(entry.source_phase_id).toBeNull();
    });

    it('should create entry with source_phase_id', () => {
      const entry = service.createEntry({
        content: 'Test item',
        source_phase_id: null,
      });

      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Test item');
      expect(entry.source_phase_id).toBe('phase-123');
    });

    it('should create entry with null source_phase_id', () => {
      const entry = service.createEntry({
        content: 'Test item',
        source_phase_id: null,
      });

      expect(entry.source_phase_id).toBeNull();
    });

    it('should allow rapid creation of multiple entries', () => {
      const entry1 = service.createEntry({ content: 'Idea 1' });
      const entry2 = service.createEntry({ content: 'Idea 2' });
      const entry3 = service.createEntry({ content: 'Idea 3' });

      expect(entry1.id).not.toBe(entry2.id);
      expect(entry2.id).not.toBe(entry3.id);
    });
  });

  describe('getEntry', () => {
    it('should retrieve entry by id', () => {
      const created = service.createEntry({
        content: 'Test entry',
      });

      const retrieved = service.getEntry(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.content).toBe('Test entry');
    });

    it('should return null for non-existent entry', () => {
      const retrieved = service.getEntry('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getAllEntries', () => {
    it('should return empty array when no entries exist', () => {
      const entries = service.getAllEntries();

      expect(entries).toEqual([]);
    });

    it('should return all entries', () => {
      service.createEntry({ content: 'Entry 1' });
      service.createEntry({ content: 'Entry 2' });
      service.createEntry({ content: 'Entry 3' });

      const entries = service.getAllEntries();

      expect(entries).toHaveLength(3);
    });

    it('should return entries with different source phases', () => {
      service.createEntry({ content: 'Entry 1', source_phase_id: null });
      service.createEntry({ content: 'Entry 2', source_phase_id: null });
      service.createEntry({ content: 'Entry 3', source_phase_id: null });

      const entries = service.getAllEntries();

      expect(entries).toHaveLength(3);
      expect(entries.map((e) => e.source_phase_id)).toContain('phase-1');
      expect(entries.map((e) => e.source_phase_id)).toContain('phase-2');
      expect(entries.map((e) => e.source_phase_id)).toContain(null);
    });
  });

  describe('updateEntry', () => {
    it('should update entry content', () => {
      const entry = service.createEntry({
        content: 'Original content',
      });

      const updated = service.updateEntry(entry.id, 'New content');

      expect(updated.content).toBe('New content');
      expect(updated.id).toBe(entry.id);
    });

    it('should preserve source_phase_id when updating', () => {
      const entry = service.createEntry({
        content: 'Original',
        source_phase_id: null,
      });

      const updated = service.updateEntry(entry.id, 'Updated');

      expect(updated.source_phase_id).toBe('phase-123');
    });

    it('should throw error for non-existent entry', () => {
      expect(() => service.updateEntry('non-existent-id', 'Content')).toThrow(
        'ParkingLot entry non-existent-id not found'
      );
    });

    it('should handle empty content', () => {
      const entry = service.createEntry({
        content: 'Original',
      });

      const updated = service.updateEntry(entry.id, '');

      expect(updated.content).toBe('');
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry', () => {
      const entry = service.createEntry({
        content: 'Test entry',
      });

      service.deleteEntry(entry.id);

      const retrieved = service.getEntry(entry.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error for non-existent entry', () => {
      expect(() => service.deleteEntry('non-existent-id')).not.toThrow();
    });

    it('should remove entry from all entries list', () => {
      const entry = service.createEntry({ content: 'Entry' });

      const beforeDelete = service.getAllEntries();
      expect(beforeDelete).toHaveLength(1);

      service.deleteEntry(entry.id);

      const afterDelete = service.getAllEntries();
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('simple capture mechanism', () => {
    it('should support rapid idea capture', () => {
      const ideas = [
        'Refactor authentication module',
        'Add logging to API endpoints',
        'Review error handling in services',
        'Update documentation',
      ];

      const entries = ideas.map((content) => service.createEntry({ content }));

      expect(entries).toHaveLength(4);
      entries.forEach((entry, i) => {
        expect(entry.content).toBe(ideas[i]);
        expect(entry.id).toBeDefined();
      });
    });

    it('should support multiline content', () => {
      const content = 'Feature idea:\n- Add user profiles\n- Add avatar upload\n- Add bio field';
      const entry = service.createEntry({ content });

      expect(entry.content).toBe(content);
    });

    it('should support entries with special characters', () => {
      const content = 'TODO: Fix bug in @getUserData() -> returns null for ID #123';
      const entry = service.createEntry({ content });

      expect(entry.content).toBe(content);
    });
  });

  describe('parking lot workflow', () => {
    it('should support create, update, delete workflow', () => {
      const created = service.createEntry({ content: 'Original' });
      expect(created.content).toBe('Original');

      const updated = service.updateEntry(created.id, 'Updated');
      expect(updated.content).toBe('Updated');

      service.deleteEntry(created.id);

      const retrieved = service.getEntry(created.id);
      expect(retrieved).toBeNull();
    });

    it('should support multiple updates', () => {
      const entry = service.createEntry({ content: 'v1' });

      const v2 = service.updateEntry(entry.id, 'v2');
      expect(v2.content).toBe('v2');

      const v3 = service.updateEntry(entry.id, 'v3');
      expect(v3.content).toBe('v3');

      const final = service.getEntry(entry.id);
      expect(final?.content).toBe('v3');
    });

    it('should support bulk operations', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        service.createEntry({ content: `Entry ${i + 1}` })
      );

      expect(service.getAllEntries()).toHaveLength(10);

      entries.slice(0, 5).forEach((entry) => service.deleteEntry(entry.id));

      expect(service.getAllEntries()).toHaveLength(5);
    });
  });
});
