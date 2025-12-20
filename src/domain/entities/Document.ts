/**
 * Document Domain Entity
 * Section 0.5.3: Document Entity Specification
 * Section 4.2: S2 Core Domain Implementation
 *
 * Plain text document attached to a phase.
 */

import { v4 as uuidv4 } from 'uuid';
import { computeDocumentHash } from '../../core/hash.js';
import type { Document as DocumentType } from '../../core/types.js';

/**
 * Document domain entity
 *
 * Per Section 0.5.3:
 * - Plain text only (no formatting, no rich text, no markdown rendering)
 * - Attached to a phase
 */
export class Document implements DocumentType {
  readonly id: string;
  readonly phase_id: string;
  readonly title: string;
  readonly content: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly content_hash: string;

  private constructor(data: DocumentType) {
    this.id = data.id;
    this.phase_id = data.phase_id;
    this.title = data.title;
    this.content = data.content;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.content_hash = data.content_hash;
  }

  /**
   * Create new Document entity
   *
   * Hash includes parent phase_id for hash chain.
   */
  static create(params: { phase_id: string; title: string; content: string }): Document {
    const id = uuidv4();
    const now = new Date().toISOString();
    const content_hash = computeDocumentHash(params.phase_id, params.title, params.content);

    return new Document({
      id,
      phase_id: params.phase_id,
      title: params.title,
      content: params.content,
      created_at: now,
      updated_at: now,
      content_hash,
    });
  }

  /**
   * Reconstitute Document from database
   */
  static fromDatabase(data: DocumentType): Document {
    return new Document(data);
  }

  /**
   * Update Document properties
   *
   * Recomputes hash per Section 0.5.5.
   * Content remains plain text only.
   */
  update(params: { title?: string; content?: string }): Document {
    const title = params.title ?? this.title;
    const content = params.content ?? this.content;
    const updated_at = new Date().toISOString();
    const content_hash = computeDocumentHash(this.phase_id, title, content);

    return new Document({
      ...this,
      title,
      content,
      updated_at,
      content_hash,
    });
  }

  /**
   * Check if document is empty
   */
  isEmpty(): boolean {
    return this.content.trim().length === 0;
  }

  /**
   * Get content length
   */
  getContentLength(): number {
    return this.content.length;
  }
}
