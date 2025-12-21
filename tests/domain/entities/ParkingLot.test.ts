/**
 * ParkingLot Entity Tests
 * Section 4.2: S2 Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { ParkingLot } from '../../../src/domain/entities/ParkingLot.js';

describe('ParkingLot Entity', () => {
  describe('factory method', () => {
    it('should create parking lot entry with content', () => {
      const entry = ParkingLot.create({
        content: 'Test parking lot item',
      });

      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Test parking lot item');
      expect(entry.source_phase_id).toBeNull();
      expect(entry.created_at).toBeDefined();
    });

    it('should create entry with optional source_phase_id', () => {
      const entry = ParkingLot.create({
        content: 'Test item',
        source_phase_id: 'phase-123',
      });

      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('Test item');
      expect(entry.source_phase_id).toBe('phase-123');
    });

    it('should create entry with null source_phase_id explicitly', () => {
      const entry = ParkingLot.create({
        content: 'Test item',
        source_phase_id: null,
      });

      expect(entry.source_phase_id).toBeNull();
    });

    it('should create entry without source_phase_id (undefined)', () => {
      const entry = ParkingLot.create({
        content: 'Test item',
      });

      expect(entry.source_phase_id).toBeNull();
    });
  });

  describe('updateContent method', () => {
    it('should update content', () => {
      const entry = ParkingLot.create({
        content: 'Original content',
      });

      const updated = entry.updateContent('New content');

      expect(updated.content).toBe('New content');
      expect(updated.id).toBe(entry.id);
      expect(updated.source_phase_id).toBe(entry.source_phase_id);
    });

    it('should preserve source_phase_id when updating', () => {
      const entry = ParkingLot.create({
        content: 'Original content',
        source_phase_id: 'phase-123',
      });

      const updated = entry.updateContent('New content');

      expect(updated.source_phase_id).toBe('phase-123');
    });

    it('should return new instance (immutability)', () => {
      const entry = ParkingLot.create({
        content: 'Original',
      });

      const updated = entry.updateContent('Updated');

      expect(updated).not.toBe(entry);
      expect(entry.content).toBe('Original');
      expect(updated.content).toBe('Updated');
    });

    it('should handle empty content', () => {
      const entry = ParkingLot.create({
        content: 'Original',
      });

      const updated = entry.updateContent('');

      expect(updated.content).toBe('');
    });
  });

  describe('fromDatabase method', () => {
    it('should reconstruct entry from database row', () => {
      const dbRow = {
        id: 'test-id',
        content: 'Test content',
        source_phase_id: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const entry = ParkingLot.fromDatabase(dbRow);

      expect(entry.id).toBe('test-id');
      expect(entry.content).toBe('Test content');
      expect(entry.source_phase_id).toBeNull();
      expect(entry.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should reconstruct entry with source_phase_id', () => {
      const dbRow = {
        id: 'test-id',
        content: 'Test content',
        source_phase_id: 'phase-123',
        created_at: '2024-01-01T00:00:00Z',
      };

      const entry = ParkingLot.fromDatabase(dbRow);

      expect(entry.source_phase_id).toBe('phase-123');
    });
  });

  describe('simple capture mechanism', () => {
    it('should not have hash field (per spec)', () => {
      const entry = ParkingLot.create({
        content: 'Test',
      });

      expect((entry as any).content_hash).toBeUndefined();
    });

    it('should not have status field (per spec)', () => {
      const entry = ParkingLot.create({
        content: 'Test',
      });

      expect((entry as any).status).toBeUndefined();
    });

    it('should support rapid capture of ideas', () => {
      const entries = [
        ParkingLot.create({ content: 'Idea 1' }),
        ParkingLot.create({ content: 'Idea 2' }),
        ParkingLot.create({ content: 'Idea 3' }),
      ];

      expect(entries).toHaveLength(3);
      entries.forEach((entry, i) => {
        expect(entry.content).toBe(`Idea ${i + 1}`);
        expect(entry.id).toBeDefined();
      });
    });

    it('should support multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const entry = ParkingLot.create({ content });

      expect(entry.content).toBe(content);
    });
  });
});
