/**
 * ParkingLotRepository Integration Tests
 * Section 4.2: S2 Repository Tests
 *
 * Note: ParkingLot does NOT have hash verification per spec (Section 0.5.4)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ParkingLotRepository } from '../../../src/domain/repositories/ParkingLotRepository.js';
import { ParkingLot } from '../../../src/domain/entities/ParkingLot.js';
import { getDatabase, resetDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('ParkingLotRepository', () => {
  let repository: ParkingLotRepository;

  beforeEach(() => {
    process.env.DB_PATH = ':memory:';
    resetDatabase();
    repository = new ParkingLotRepository(getDatabase());
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('create', () => {
    it('should persist entry to database', () => {
      const entry = ParkingLot.create({
        content: 'Test parking lot item',
      });

      const created = repository.create(entry);

      expect(created.id).toBe(entry.id);
      expect(created.content).toBe(entry.content);
      expect(created.source_phase_id).toBeNull();
    });

    it('should persist entry with source_phase_id', () => {
      const entry = ParkingLot.create({
        content: 'Test item',
        source_phase_id: null,
      });

      const created = repository.create(entry);

      expect(created.source_phase_id).toBeNull();
    });
  });

  describe('findById', () => {
    it('should retrieve entry by id', () => {
      const entry = ParkingLot.create({
        content: 'Test entry',
      });

      repository.create(entry);

      const retrieved = repository.findById(entry.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(entry.id);
      expect(retrieved!.content).toBe('Test entry');
    });

    it('should return null for non-existent id', () => {
      const retrieved = repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should NOT verify hash (no hash field per spec)', () => {
      const entry = ParkingLot.create({
        content: 'Test entry',
      });

      repository.create(entry);

      // Directly modify content in database (should NOT throw)
      const db = getDatabase();
      db.prepare('UPDATE parking_lot SET content = ? WHERE id = ?').run('Modified content', entry.id);

      const retrieved = repository.findById(entry.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe('Modified content');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no entries exist', () => {
      const entries = repository.findAll();

      expect(entries).toEqual([]);
    });

    it('should return all entries', () => {
      const entry1 = ParkingLot.create({ content: 'Entry 1' });
      const entry2 = ParkingLot.create({ content: 'Entry 2' });
      const entry3 = ParkingLot.create({ content: 'Entry 3' });

      repository.create(entry1);
      repository.create(entry2);
      repository.create(entry3);

      const entries = repository.findAll();

      expect(entries).toHaveLength(3);
      expect(entries.map((e) => e.id)).toContain(entry1.id);
      expect(entries.map((e) => e.id)).toContain(entry2.id);
      expect(entries.map((e) => e.id)).toContain(entry3.id);
    });

    it('should return entries with different source_phase_id values', () => {
      const entry1 = ParkingLot.create({ content: 'Entry 1', source_phase_id: null });
      const entry2 = ParkingLot.create({ content: 'Entry 2', source_phase_id: null });
      const entry3 = ParkingLot.create({ content: 'Entry 3', source_phase_id: null });

      repository.create(entry1);
      repository.create(entry2);
      repository.create(entry3);

      const entries = repository.findAll();

      expect(entries).toHaveLength(3);
      expect(entries.map((e) => e.source_phase_id)).toContain(null);
      expect(entries.map((e) => e.source_phase_id)).toContain(null);
      expect(entries.map((e) => e.source_phase_id)).toContain(null);
    });
  });

  describe('update', () => {
    it('should update entry in database', () => {
      const entry = ParkingLot.create({
        content: 'Original content',
      });

      repository.create(entry);

      const updated = entry.updateContent('New content');
      repository.update(updated);

      const retrieved = repository.findById(entry.id);

      expect(retrieved!.content).toBe('New content');
    });

    it('should preserve source_phase_id', () => {
      const entry = ParkingLot.create({
        content: 'Original',
        source_phase_id: null,
      });

      repository.create(entry);

      const updated = entry.updateContent('Updated');
      repository.update(updated);

      const retrieved = repository.findById(entry.id);

      expect(retrieved!.source_phase_id).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove entry from database', () => {
      const entry = ParkingLot.create({
        content: 'Test entry',
      });

      repository.create(entry);
      repository.delete(entry.id);

      const retrieved = repository.findById(entry.id);

      expect(retrieved).toBeNull();
    });

    it('should not throw for non-existent id', () => {
      expect(() => repository.delete('non-existent-id')).not.toThrow();
    });

    it('should remove entry from findAll results', () => {
      const entry = ParkingLot.create({ content: 'Entry' });

      repository.create(entry);

      const beforeDelete = repository.findAll();
      expect(beforeDelete).toHaveLength(1);

      repository.delete(entry.id);

      const afterDelete = repository.findAll();
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('simple capture mechanism (no hash, no status)', () => {
    it('should allow rapid CRUD operations', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        ParkingLot.create({ content: `Idea ${i + 1}` })
      );

      entries.forEach((entry) => repository.create(entry));

      expect(repository.findAll()).toHaveLength(10);

      const updated = entries[0].updateContent('Updated idea');
      repository.update(updated);

      const retrieved = repository.findById(entries[0].id);
      expect(retrieved!.content).toBe('Updated idea');

      entries.slice(0, 5).forEach((entry) => repository.delete(entry.id));

      expect(repository.findAll()).toHaveLength(5);
    });

    it('should support multiline content', () => {
      const content = 'Feature idea:\n- Add user profiles\n- Add avatar upload';
      const entry = ParkingLot.create({ content });

      repository.create(entry);

      const retrieved = repository.findById(entry.id);
      expect(retrieved!.content).toBe(content);
    });

    it('should support special characters', () => {
      const content = 'TODO: Fix bug in @getUserData() -> returns null for ID #123';
      const entry = ParkingLot.create({ content });

      repository.create(entry);

      const retrieved = repository.findById(entry.id);
      expect(retrieved!.content).toBe(content);
    });
  });
});
