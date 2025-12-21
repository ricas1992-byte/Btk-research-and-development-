/**
 * Document Entity Tests
 * Section 4.2: S2 Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { Document } from '../../../src/domain/entities/Document.js';
import { computeDocumentHash } from '../../../src/core/hash.js';

describe('Document Entity', () => {
  const testPhaseId = 'phase-123';

  describe('factory method', () => {
    it('should create document with all fields', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      expect(document.id).toBeDefined();
      expect(document.phase_id).toBe(testPhaseId);
      expect(document.title).toBe('Test Document');
      expect(document.content).toBe('Test content');
      expect(document.created_at).toBeDefined();
      expect(document.updated_at).toBeDefined();
      expect(document.content_hash).toBeDefined();
    });

    it('should compute correct hash on creation', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      const expectedHash = computeDocumentHash(testPhaseId, 'Test Document', 'Test content');
      expect(document.content_hash).toBe(expectedHash);
    });
  });

  describe('update method', () => {
    it('should update title only', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Content',
      });

      const updated = document.update({ title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('Content');
      expect(updated.id).toBe(document.id);
      expect(updated.phase_id).toBe(testPhaseId);
    });

    it('should update content only', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Title',
        content: 'Original Content',
      });

      const updated = document.update({ content: 'New Content' });

      expect(updated.title).toBe('Title');
      expect(updated.content).toBe('New Content');
    });

    it('should update both title and content', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Original Content',
      });

      const updated = document.update({
        title: 'New Title',
        content: 'New Content',
      });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('New Content');
    });

    it('should recompute hash after update', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Original Content',
      });

      const updated = document.update({
        title: 'New Title',
        content: 'New Content',
      });

      expect(updated.content_hash).not.toBe(document.content_hash);

      const expectedHash = computeDocumentHash(testPhaseId, 'New Title', 'New Content');
      expect(updated.content_hash).toBe(expectedHash);
    });

    it('should return new instance (immutability)', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original',
        content: 'Content',
      });

      const updated = document.update({ title: 'Updated' });

      expect(updated).not.toBe(document);
      expect(document.title).toBe('Original');
      expect(updated.title).toBe('Updated');
    });

    it('should handle empty updates gracefully', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Title',
        content: 'Content',
      });

      const updated = document.update({});

      expect(updated.title).toBe('Title');
      expect(updated.content).toBe('Content');
      expect(updated.id).toBe(document.id);
    });
  });

  describe('fromDatabase method', () => {
    it('should reconstruct document from database row', () => {
      const dbRow = {
        id: 'test-id',
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        content_hash: 'test-hash',
      };

      const document = Document.fromDatabase(dbRow);

      expect(document.id).toBe('test-id');
      expect(document.phase_id).toBe(testPhaseId);
      expect(document.title).toBe('Test Document');
      expect(document.content).toBe('Test content');
      expect(document.content_hash).toBe('test-hash');
    });
  });

  describe('plain text content', () => {
    it('should handle plain text without markdown', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Plain Text',
        content: 'This is plain text content without any markdown.',
      });

      expect(document.content).toBe('This is plain text content without any markdown.');
    });

    it('should preserve special characters in content', () => {
      const content = 'Special chars: @#$%^&*()[]{}|\\/<>?,.:;"\'';
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Special',
        content,
      });

      expect(document.content).toBe(content);
    });

    it('should handle multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Multiline',
        content,
      });

      expect(document.content).toBe(content);
    });

    it('should handle empty content', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Empty',
        content: '',
      });

      expect(document.content).toBe('');
      expect(document.content_hash).toBeDefined();
    });
  });
});
