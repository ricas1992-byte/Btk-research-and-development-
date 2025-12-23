/**
 * Document Service
 * Section 4.2: S2 Service Implementation
 */

import { Document } from '../entities/Document.js';
import { DocumentRepository } from '../repositories/DocumentRepository.js';

export class DocumentService {
  constructor(private documentRepo: DocumentRepository) {}

  createDocument(params: { phase_id: string; title: string; content: string }): Document {
    const document = Document.create(params);
    return this.documentRepo.create(document);
  }

  getDocument(id: string): Document | null {
    return this.documentRepo.findById(id);
  }

  getDocumentsByPhase(phaseId: string): Document[] {
    return this.documentRepo.findByPhaseId(phaseId);
  }

  updateDocument(id: string, params: { title?: string; content?: string }): Document {
    const document = this.documentRepo.findById(id);
    if (!document) {
      throw new Error(`Document ${id} not found`);
    }

    const updated = document.update(params);
    return this.documentRepo.update(updated);
  }

  deleteDocument(id: string): void {
    this.documentRepo.delete(id);
  }
}
