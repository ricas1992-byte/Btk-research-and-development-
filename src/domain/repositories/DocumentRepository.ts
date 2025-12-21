/**
 * Document Repository
 * Section 4.2: S2 Repository Implementation
 */

import type Database from 'better-sqlite3';
import { Document } from '../entities/Document.js';
import { verifyDocumentHashOrThrow } from '../../core/verification.js';
import type { Document as DocumentType } from '../../core/types.js';

export class DocumentRepository {
  constructor(private db: Database.Database) {}

  create(document: Document): Document {
    const stmt = this.db.prepare(`
      INSERT INTO document (id, phase_id, title, content, created_at, updated_at, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      document.id,
      document.phase_id,
      document.title,
      document.content,
      document.created_at,
      document.updated_at,
      document.content_hash
    );

    return document;
  }

  findById(id: string): Document | null {
    const stmt = this.db.prepare('SELECT * FROM document WHERE id = ?');
    const row = stmt.get(id) as DocumentType | undefined;

    if (!row) {
      return null;
    }

    const document = Document.fromDatabase(row);
    verifyDocumentHashOrThrow(document);

    return document;
  }

  findByPhaseId(phaseId: string): Document[] {
    const stmt = this.db.prepare('SELECT * FROM document WHERE phase_id = ? ORDER BY created_at');
    const rows = stmt.all(phaseId) as DocumentType[];

    return rows.map((row) => {
      const document = Document.fromDatabase(row);
      verifyDocumentHashOrThrow(document);
      return document;
    });
  }

  update(document: Document): Document {
    const stmt = this.db.prepare(`
      UPDATE document
      SET title = ?, content = ?, updated_at = ?, content_hash = ?
      WHERE id = ?
    `);

    stmt.run(document.title, document.content, document.updated_at, document.content_hash, document.id);

    return document;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM document WHERE id = ?');
    stmt.run(id);
  }
}
