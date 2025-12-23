/**
 * DocumentService Tests
 * Section 4.2: S2 Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentService } from '../../../src/domain/services/DocumentService.js';
import { DocumentRepository } from '../../../src/domain/repositories/DocumentRepository.js';
import { PhaseService } from '../../../src/domain/services/PhaseService.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDatabase, initDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('DocumentService', () => {
  let service: DocumentService;
  let repository: DocumentRepository;
  let phaseService: PhaseService;
  let testPhaseId: string;

  beforeEach(() => {
    initDatabase({ path: ':memory:' });
    repository = new DocumentRepository(getDatabase());
    service = new DocumentService(repository);

    const phaseRepo = new PhaseRepository(getDatabase());
    phaseService = new PhaseService(phaseRepo);

    const phase = phaseService.createPhase({
      name: 'Test Phase',
      description: 'Description',
    });
    testPhaseId = phase.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createDocument', () => {
    it('should create document with all fields', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      expect(document.id).toBeDefined();
      expect(document.phase_id).toBe(testPhaseId);
      expect(document.title).toBe('Test Document');
      expect(document.content).toBe('Test content');
    });

    it('should allow multiple documents for same phase', () => {
      const doc1 = service.createDocument({
        phase_id: testPhaseId,
        title: 'Document 1',
        content: 'Content 1',
      });

      const doc2 = service.createDocument({
        phase_id: testPhaseId,
        title: 'Document 2',
        content: 'Content 2',
      });

      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.phase_id).toBe(testPhaseId);
      expect(doc2.phase_id).toBe(testPhaseId);
    });
  });

  describe('getDocument', () => {
    it('should retrieve document by id', () => {
      const created = service.createDocument({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Content',
      });

      const retrieved = service.getDocument(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Document');
      expect(retrieved!.content).toBe('Content');
    });

    it('should return null for non-existent document', () => {
      const retrieved = service.getDocument('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getDocumentsByPhase', () => {
    it('should return empty array when no documents exist', () => {
      const documents = service.getDocumentsByPhase(testPhaseId);

      expect(documents).toEqual([]);
    });

    it('should return all documents for phase', () => {
      service.createDocument({
        phase_id: testPhaseId,
        title: 'Document 1',
        content: 'Content 1',
      });

      service.createDocument({
        phase_id: testPhaseId,
        title: 'Document 2',
        content: 'Content 2',
      });

      const documents = service.getDocumentsByPhase(testPhaseId);

      expect(documents).toHaveLength(2);
    });

    it('should only return documents for specified phase', () => {
      service.createDocument({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      const documents = service.getDocumentsByPhase('other-phase-id');

      expect(documents).toHaveLength(0);
    });
  });

  describe('updateDocument', () => {
    it('should update document title only', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Content',
      });

      const updated = service.updateDocument(document.id, { title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('Content');
    });

    it('should update document content only', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Title',
        content: 'Original Content',
      });

      const updated = service.updateDocument(document.id, { content: 'New Content' });

      expect(updated.title).toBe('Title');
      expect(updated.content).toBe('New Content');
    });

    it('should update both title and content', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Original Content',
      });

      const updated = service.updateDocument(document.id, {
        title: 'New Title',
        content: 'New Content',
      });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('New Content');
    });

    it('should throw error for non-existent document', () => {
      expect(() => service.updateDocument('non-existent-id', { title: 'Title' })).toThrow(
        'Document non-existent-id not found'
      );
    });

    it('should handle empty updates', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Title',
        content: 'Content',
      });

      const updated = service.updateDocument(document.id, {});

      expect(updated.title).toBe('Title');
      expect(updated.content).toBe('Content');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Content',
      });

      service.deleteDocument(document.id);

      const retrieved = service.getDocument(document.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error for non-existent document', () => {
      expect(() => service.deleteDocument('non-existent-id')).not.toThrow();
    });

    it('should remove document from phase list', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      const beforeDelete = service.getDocumentsByPhase(testPhaseId);
      expect(beforeDelete).toHaveLength(1);

      service.deleteDocument(document.id);

      const afterDelete = service.getDocumentsByPhase(testPhaseId);
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('plain text content', () => {
    it('should handle plain text without markdown', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Plain Text',
        content: 'This is plain text content.',
      });

      expect(document.content).toBe('This is plain text content.');
    });

    it('should preserve special characters', () => {
      const content = 'Special: @#$%^&*()';
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Special',
        content,
      });

      expect(document.content).toBe(content);
    });

    it('should handle multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Multiline',
        content,
      });

      expect(document.content).toBe(content);
    });

    it('should handle empty content', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Empty',
        content: '',
      });

      expect(document.content).toBe('');
    });
  });

  describe('document lifecycle', () => {
    it('should support create, update, delete workflow', () => {
      const created = service.createDocument({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Original',
      });

      expect(created.content).toBe('Original');

      const updated = service.updateDocument(created.id, { content: 'Updated' });
      expect(updated.content).toBe('Updated');

      service.deleteDocument(created.id);

      const retrieved = service.getDocument(created.id);
      expect(retrieved).toBeNull();
    });

    it('should support multiple updates', () => {
      const document = service.createDocument({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'v1',
      });

      const v2 = service.updateDocument(document.id, { content: 'v2' });
      expect(v2.content).toBe('v2');

      const v3 = service.updateDocument(document.id, { content: 'v3' });
      expect(v3.content).toBe('v3');

      const final = service.getDocument(document.id);
      expect(final?.content).toBe('v3');
    });
  });
});
