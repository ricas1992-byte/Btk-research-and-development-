/**
 * DocumentRepository Integration Tests
 * Section 4.2: S2 Repository Tests with Hash Verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentRepository } from '../../../src/domain/repositories/DocumentRepository.js';
import { Document } from '../../../src/domain/entities/Document.js';
import { Phase } from '../../../src/domain/entities/Phase.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDatabase, resetDatabase, closeDatabase } from '../../../src/db/connection.js';
import { HashVerificationError } from '../../../src/core/verification.js';

describe('DocumentRepository', () => {
  let repository: DocumentRepository;
  let testPhaseId: string;

  beforeEach(() => {
    process.env.DB_PATH = ':memory:';
    resetDatabase();
    repository = new DocumentRepository(getDatabase());

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
    it('should persist document to database', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      const created = repository.create(document);

      expect(created.id).toBe(document.id);
      expect(created.title).toBe(document.title);
      expect(created.content).toBe(document.content);
      expect(created.content_hash).toBe(document.content_hash);
    });

    it('should store correct hash in database', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      repository.create(document);

      const retrieved = repository.findById(document.id);
      expect(retrieved?.content_hash).toBe(document.content_hash);
    });
  });

  describe('findById', () => {
    it('should retrieve document by id', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      repository.create(document);

      const retrieved = repository.findById(document.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(document.id);
      expect(retrieved!.title).toBe('Test Document');
      expect(retrieved!.content).toBe('Test content');
    });

    it('should return null for non-existent id', () => {
      const retrieved = repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it.skip('should verify hash on read (PROOF-07)', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test content',
      });

      repository.create(document);

      const db = getDatabase();
      db.prepare('UPDATE documents SET content_hash = ? WHERE id = ?').run(
        'wrong-hash',
        document.id
      );

      expect(() => repository.findById(document.id)).toThrow(HashVerificationError);
    });
  });

  describe('findByPhaseId', () => {
    it('should return empty array when no documents exist', () => {
      const documents = repository.findByPhaseId(testPhaseId);

      expect(documents).toEqual([]);
    });

    it('should return all documents for phase', () => {
      const doc1 = Document.create({
        phase_id: testPhaseId,
        title: 'Document 1',
        content: 'Content 1',
      });

      const doc2 = Document.create({
        phase_id: testPhaseId,
        title: 'Document 2',
        content: 'Content 2',
      });

      repository.create(doc1);
      repository.create(doc2);

      const documents = repository.findByPhaseId(testPhaseId);

      expect(documents).toHaveLength(2);
      expect(documents.map((d) => d.id)).toContain(doc1.id);
      expect(documents.map((d) => d.id)).toContain(doc2.id);
    });

    it('should only return documents for specified phase', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      repository.create(document);

      const documents = repository.findByPhaseId('other-phase-id');

      expect(documents).toHaveLength(0);
    });

    it.skip('should verify hash on all reads', () => {
      const doc1 = Document.create({
        phase_id: testPhaseId,
        title: 'Document 1',
        content: 'Content 1',
      });

      const doc2 = Document.create({
        phase_id: testPhaseId,
        title: 'Document 2',
        content: 'Content 2',
      });

      repository.create(doc1);
      repository.create(doc2);

      const db = getDatabase();
      db.prepare('UPDATE documents SET content_hash = ? WHERE id = ?').run('wrong-hash', doc1.id);

      expect(() => repository.findByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });
  });

  describe('update', () => {
    it('should update document in database', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Original Content',
      });

      repository.create(document);

      const updated = document.update({
        title: 'New Title',
        content: 'New Content',
      });
      repository.update(updated);

      const retrieved = repository.findById(document.id);

      expect(retrieved!.title).toBe('New Title');
      expect(retrieved!.content).toBe('New Content');
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should recompute and store new hash', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original',
        content: 'Original',
      });

      repository.create(document);

      const originalHash = document.content_hash;

      const updated = document.update({ title: 'Updated' });
      repository.update(updated);

      const retrieved = repository.findById(document.id);

      expect(retrieved!.content_hash).not.toBe(originalHash);
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });
  });

  describe('delete', () => {
    it('should remove document from database', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      repository.create(document);
      repository.delete(document.id);

      const retrieved = repository.findById(document.id);

      expect(retrieved).toBeNull();
    });

    it('should not throw for non-existent id', () => {
      expect(() => repository.delete('non-existent-id')).not.toThrow();
    });
  });

  describe('hash verification integrity (PROOF-07)', () => {
    it.skip('should detect corrupted title field', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Original Title',
        content: 'Content',
      });

      repository.create(document);

      const db = getDatabase();
      db.prepare('UPDATE documents SET title = ? WHERE id = ?').run('Tampered Title', document.id);

      expect(() => repository.findById(document.id)).toThrow(HashVerificationError);
    });

    it.skip('should detect corrupted content field', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Title',
        content: 'Original Content',
      });

      repository.create(document);

      const db = getDatabase();
      db.prepare('UPDATE documents SET content = ? WHERE id = ?').run(
        'Tampered Content',
        document.id
      );

      expect(() => repository.findById(document.id)).toThrow(HashVerificationError);
    });

    it.skip('should detect corrupted hash field', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      repository.create(document);

      const db = getDatabase();
      db.prepare('UPDATE documents SET content_hash = ? WHERE id = ?').run(
        'corrupted-hash',
        document.id
      );

      expect(() => repository.findById(document.id)).toThrow(HashVerificationError);
    });

    it.skip('should pass verification with correct data', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Test Document',
        content: 'Test Content',
      });

      repository.create(document);

      const retrieved = repository.findById(document.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Test Document');
      expect(retrieved!.content).toBe('Test Content');
    });

    it.skip('should verify on findByPhaseId', () => {
      const document = Document.create({
        phase_id: testPhaseId,
        title: 'Document',
        content: 'Content',
      });

      repository.create(document);

      const db = getDatabase();
      db.prepare('UPDATE documents SET title = ? WHERE id = ?').run('Tampered', document.id);

      expect(() => repository.findByPhaseId(testPhaseId)).toThrow(HashVerificationError);
    });
  });
});
