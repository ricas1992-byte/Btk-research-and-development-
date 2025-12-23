/**
 * Phase Entity Tests
 * Section 4.2: S2 Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { Phase } from '../../../src/domain/entities/Phase.js';
import { computePhaseHash } from '../../../src/core/hash.js';

describe('Phase Entity', () => {
  describe('factory method', () => {
    it('should create phase with ACTIVE status', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Test Description',
      });

      expect(phase.id).toBeDefined();
      expect(phase.name).toBe('Test Phase');
      expect(phase.description).toBe('Test Description');
      expect(phase.status).toBe('ACTIVE');
      expect(phase.created_at).toBeDefined();
      expect(phase.updated_at).toBeDefined();
      expect(phase.content_hash).toBeDefined();
    });

    it('should compute correct hash on creation', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Test Description',
      });

      const expectedHash = computePhaseHash(phase.id, phase.name, phase.description);
      expect(phase.content_hash).toBe(expectedHash);
    });
  });

  describe('update method', () => {
    it('should update name and recompute hash', () => {
      const phase = Phase.create({
        name: 'Original Name',
        description: 'Description',
      });

      const updated = phase.update({ name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Description');
      expect(updated.id).toBe(phase.id);
      expect(updated.content_hash).not.toBe(phase.content_hash);

      const expectedHash = computePhaseHash(updated.id, 'New Name', 'Description');
      expect(updated.content_hash).toBe(expectedHash);
    });

    it('should update description and recompute hash', () => {
      const phase = Phase.create({
        name: 'Name',
        description: 'Original Description',
      });

      const updated = phase.update({ description: 'New Description' });

      expect(updated.name).toBe('Name');
      expect(updated.description).toBe('New Description');
      expect(updated.content_hash).not.toBe(phase.content_hash);
    });

    it('should update both fields and recompute hash', () => {
      const phase = Phase.create({
        name: 'Original Name',
        description: 'Original Description',
      });

      const updated = phase.update({
        name: 'New Name',
        description: 'New Description',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New Description');
      expect(updated.content_hash).not.toBe(phase.content_hash);
    });

    it('should return new instance (immutability)', () => {
      const phase = Phase.create({
        name: 'Original',
        description: 'Description',
      });

      const updated = phase.update({ name: 'Updated' });

      expect(updated).not.toBe(phase);
      expect(phase.name).toBe('Original');
      expect(updated.name).toBe('Updated');
    });
  });

  describe('complete method', () => {
    it('should transition ACTIVE to COMPLETED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = phase.complete();

      expect(completed.status).toBe('COMPLETED');
      expect(completed.id).toBe(phase.id);
    });

    it('should throw if already COMPLETED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = phase.complete();

      expect(() => completed.complete()).toThrow('Cannot complete phase in');
    });

    it('should throw if ABANDONED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = phase.abandon();

      expect(() => abandoned.complete()).toThrow('Cannot complete phase in');
    });

    it('should return new instance (immutability)', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = phase.complete();

      expect(completed).not.toBe(phase);
      expect(phase.status).toBe('ACTIVE');
      expect(completed.status).toBe('COMPLETED');
    });
  });

  describe('abandon method', () => {
    it('should transition ACTIVE to ABANDONED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = phase.abandon();

      expect(abandoned.status).toBe('ABANDONED');
      expect(abandoned.id).toBe(phase.id);
    });

    it('should throw if already COMPLETED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = phase.complete();

      expect(() => completed.abandon()).toThrow('Cannot abandon phase in');
    });

    it('should throw if already ABANDONED', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = phase.abandon();

      expect(() => abandoned.abandon()).toThrow('Cannot abandon phase in');
    });

    it('should return new instance (immutability)', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = phase.abandon();

      expect(abandoned).not.toBe(phase);
      expect(phase.status).toBe('ACTIVE');
      expect(abandoned.status).toBe('ABANDONED');
    });
  });

  describe('fromDatabase method', () => {
    it('should reconstruct phase from database row', () => {
      const dbRow = {
        id: 'test-id',
        name: 'Test Phase',
        description: 'Description',
        status: 'ACTIVE' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        content_hash: 'test-hash',
      };

      const phase = Phase.fromDatabase(dbRow);

      expect(phase.id).toBe('test-id');
      expect(phase.name).toBe('Test Phase');
      expect(phase.description).toBe('Description');
      expect(phase.status).toBe('ACTIVE');
      expect(phase.content_hash).toBe('test-hash');
    });
  });

  describe('isActive method', () => {
    it('should return true for ACTIVE phase', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      expect(phase.isActive()).toBe(true);
    });

    it('should return false for COMPLETED phase', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const completed = phase.complete();

      expect(completed.isActive()).toBe(false);
    });

    it('should return false for ABANDONED phase', () => {
      const phase = Phase.create({
        name: 'Test Phase',
        description: 'Description',
      });

      const abandoned = phase.abandon();

      expect(abandoned.isActive()).toBe(false);
    });
  });
});
