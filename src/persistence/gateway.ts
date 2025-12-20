import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  Idea,
  Phase,
  Document,
  Decision,
  Task,
  DocumentSnapshot,
  AuditLogEntry,
  IdeaStatus,
  PhaseStatus,
  TaskStatus,
} from '../types/entities.js';
import { NotFoundError, TokenAlreadyUsedError } from '../types/errors.js';
import { computeDecisionHash, computeSnapshotHash } from './hash-utils.js';

/**
 * Data gateway for all database operations.
 * Maps between database rows and domain entities.
 */

export class Gateway {
  constructor(private db: Database.Database) {}

  // ===== PROJECT =====

  getProject(): Project {
    const row = this.db.prepare('SELECT * FROM project WHERE id = ?').get('singleton') as any;
    return this.mapProjectFromDb(row);
  }

  updateProject(name: string): Project {
    const now = new Date().toISOString();
    this.db
      .prepare('UPDATE project SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, now, 'singleton');
    this.logAudit('project', 'singleton', 'update', null, JSON.stringify({ name }));
    return this.getProject();
  }

  // ===== IDEAS =====

  getIdeas(status?: IdeaStatus): Idea[] {
    const query = status
      ? 'SELECT * FROM idea WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM idea ORDER BY created_at DESC';
    const rows = status ? this.db.prepare(query).all(status) : this.db.prepare(query).all();
    return rows.map((row: any) => this.mapIdeaFromDb(row));
  }

  getIdea(id: string): Idea {
    const row = this.db.prepare('SELECT * FROM idea WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Idea ${id} not found`);
    }
    return this.mapIdeaFromDb(row);
  }

  createIdea(title: string, description: string): Idea {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO idea (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, title, description, 'PARKED', now, now);
    this.logAudit('idea', id, 'create', null, JSON.stringify({ title, description }));
    return this.getIdea(id);
  }

  updateIdeaStatus(id: string, status: IdeaStatus): Idea {
    const now = new Date().toISOString();
    const timestampField =
      status === 'PROMOTED' ? 'promoted_at' : status === 'ABANDONED' ? 'abandoned_at' : null;

    if (timestampField) {
      this.db
        .prepare(`UPDATE idea SET status = ?, ${timestampField} = ?, updated_at = ? WHERE id = ?`)
        .run(status, now, now, id);
    } else {
      this.db
        .prepare('UPDATE idea SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, now, id);
    }

    this.logAudit('idea', id, 'status_change', null, JSON.stringify({ status }));
    return this.getIdea(id);
  }

  // ===== PHASES =====

  getPhases(status?: PhaseStatus): Phase[] {
    const query = status
      ? 'SELECT * FROM phase WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM phase ORDER BY created_at DESC';
    const rows = status ? this.db.prepare(query).all(status) : this.db.prepare(query).all();
    return rows.map((row: any) => this.mapPhaseFromDb(row));
  }

  getPhase(id: string): Phase {
    const row = this.db.prepare('SELECT * FROM phase WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Phase ${id} not found`);
    }
    return this.mapPhaseFromDb(row);
  }

  getActivePhase(): Phase | null {
    const row = this.db.prepare("SELECT * FROM phase WHERE status = 'ACTIVE'").get() as any;
    return row ? this.mapPhaseFromDb(row) : null;
  }

  createPhase(title: string, objective: string, sourceIdeaId: string): Phase {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO phase (id, title, objective, source_idea_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, title, objective, sourceIdeaId, 'ACTIVE', now, now);
    this.logAudit('phase', id, 'create', null, JSON.stringify({ title, objective, sourceIdeaId }));
    return this.getPhase(id);
  }

  updatePhaseStatus(id: string, status: PhaseStatus): Phase {
    const now = new Date().toISOString();
    if (status === 'CLOSED') {
      this.db
        .prepare('UPDATE phase SET status = ?, closed_at = ?, updated_at = ? WHERE id = ?')
        .run(status, now, now, id);
    } else {
      this.db
        .prepare('UPDATE phase SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, now, id);
    }
    this.logAudit('phase', id, 'status_change', null, JSON.stringify({ status }));
    return this.getPhase(id);
  }

  // ===== DOCUMENTS =====

  getDocuments(phaseId?: string): Document[] {
    const query = phaseId
      ? 'SELECT * FROM document WHERE phase_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM document ORDER BY created_at DESC';
    const rows = phaseId ? this.db.prepare(query).all(phaseId) : this.db.prepare(query).all();
    return rows.map((row: any) => this.mapDocumentFromDb(row));
  }

  getDocument(id: string): Document {
    const row = this.db.prepare('SELECT * FROM document WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Document ${id} not found`);
    }
    return this.mapDocumentFromDb(row);
  }

  createDocument(phaseId: string, title: string, content: string): Document {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO document (id, phase_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, phaseId, title, content, now, now);
    this.logAudit('document', id, 'create', null, JSON.stringify({ phaseId, title }));
    return this.getDocument(id);
  }

  updateDocument(id: string, updates: { title?: string; content?: string }): Document {
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }

    values.push(id);
    this.db.prepare(`UPDATE document SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    this.logAudit('document', id, 'update', null, JSON.stringify(updates));
    return this.getDocument(id);
  }

  deleteDocument(id: string): void {
    this.db.prepare('DELETE FROM document WHERE id = ?').run(id);
    this.logAudit('document', id, 'delete', null, null);
  }

  // ===== DECISIONS =====

  getDecisions(phaseId?: string): Decision[] {
    const query = phaseId
      ? 'SELECT * FROM decision WHERE phase_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM decision ORDER BY created_at DESC';
    const rows = phaseId ? this.db.prepare(query).all(phaseId) : this.db.prepare(query).all();
    return rows.map((row: any) => this.mapDecisionFromDb(row));
  }

  getDecision(id: string): Decision {
    const row = this.db.prepare('SELECT * FROM decision WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Decision ${id} not found`);
    }
    return this.mapDecisionFromDb(row);
  }

  createDecision(phaseId: string, title: string, statement: string, rationale: string): Decision {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO decision (id, phase_id, title, statement, rationale, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, phaseId, title, statement, rationale, 'DRAFT', now, now);
    this.logAudit('decision', id, 'create', null, JSON.stringify({ phaseId, title }));
    return this.getDecision(id);
  }

  updateDecision(
    id: string,
    updates: { title?: string; statement?: string; rationale?: string }
  ): Decision {
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.statement !== undefined) {
      fields.push('statement = ?');
      values.push(updates.statement);
    }
    if (updates.rationale !== undefined) {
      fields.push('rationale = ?');
      values.push(updates.rationale);
    }

    values.push(id);
    this.db.prepare(`UPDATE decision SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    this.logAudit('decision', id, 'update', null, JSON.stringify(updates));
    return this.getDecision(id);
  }

  lockDecision(id: string): Decision {
    const decision = this.getDecision(id);
    const hash = computeDecisionHash(decision.title, decision.statement, decision.rationale);
    const now = new Date().toISOString();

    this.db
      .prepare(
        "UPDATE decision SET status = 'LOCKED', content_hash = ?, locked_at = ?, updated_at = ? WHERE id = ?"
      )
      .run(hash, now, now, id);

    this.logAudit('decision', id, 'lock', null, JSON.stringify({ hash }));
    return this.getDecision(id);
  }

  deleteDecision(id: string): void {
    this.db.prepare('DELETE FROM decision WHERE id = ?').run(id);
    this.logAudit('decision', id, 'delete', null, null);
  }

  // ===== TASKS =====

  getTasks(filters?: { phaseId?: string; decisionId?: string }): Task[] {
    let query = 'SELECT * FROM task';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.phaseId) {
      conditions.push('phase_id = ?');
      params.push(filters.phaseId);
    }
    if (filters?.decisionId) {
      conditions.push('decision_id = ?');
      params.push(filters.decisionId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row: any) => this.mapTaskFromDb(row));
  }

  getTask(id: string): Task {
    const row = this.db.prepare('SELECT * FROM task WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Task ${id} not found`);
    }
    return this.mapTaskFromDb(row);
  }

  createTask(decisionId: string, phaseId: string, title: string, description: string): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO task (id, decision_id, phase_id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, decisionId, phaseId, title, description, 'PENDING', now, now);
    this.logAudit('task', id, 'create', null, JSON.stringify({ decisionId, phaseId, title }));
    return this.getTask(id);
  }

  updateTaskStatus(id: string, status: TaskStatus): Task {
    const now = new Date().toISOString();
    const timestampField =
      status === 'COMPLETED' ? 'completed_at' : status === 'VOIDED' ? 'voided_at' : null;

    if (timestampField) {
      this.db
        .prepare(`UPDATE task SET status = ?, ${timestampField} = ?, updated_at = ? WHERE id = ?`)
        .run(status, now, now, id);
    } else {
      this.db
        .prepare('UPDATE task SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, now, id);
    }

    this.logAudit('task', id, 'status_change', null, JSON.stringify({ status }));
    return this.getTask(id);
  }

  // ===== DOCUMENT SNAPSHOTS =====

  createSnapshot(
    phaseId: string,
    originalDocumentId: string,
    title: string,
    content: string
  ): DocumentSnapshot {
    const id = uuidv4();
    const hash = computeSnapshotHash(title, content);
    const now = new Date().toISOString();

    this.db
      .prepare(
        'INSERT INTO document_snapshot (id, phase_id, original_document_id, title, content, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, phaseId, originalDocumentId, title, content, hash, now);

    this.logAudit('snapshot', id, 'create', null, JSON.stringify({ phaseId, originalDocumentId }));
    return this.getSnapshot(id);
  }

  getSnapshot(id: string): DocumentSnapshot {
    const row = this.db.prepare('SELECT * FROM document_snapshot WHERE id = ?').get(id) as any;
    if (!row) {
      throw new NotFoundError(`Snapshot ${id} not found`);
    }
    return this.mapSnapshotFromDb(row);
  }

  getSnapshots(phaseId: string): DocumentSnapshot[] {
    const rows = this.db
      .prepare('SELECT * FROM document_snapshot WHERE phase_id = ? ORDER BY created_at DESC')
      .all(phaseId);
    return rows.map((row: any) => this.mapSnapshotFromDb(row));
  }

  // ===== AUDIT LOG =====

  private logAudit(
    entityType: string,
    entityId: string,
    action: string,
    oldState: string | null,
    newState: string | null,
    details?: string
  ): void {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO audit_log (id, entity_type, entity_id, action, old_state, new_state, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, entityType, entityId, action, oldState, newState, details || null, now);
  }

  getAuditLog(limit: number = 100, offset: number = 0): AuditLogEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
    return rows.map((row: any) => this.mapAuditLogFromDb(row));
  }

  // ===== TOKENS =====

  markTokenAsUsed(token: string, action: string): void {
    const now = new Date().toISOString();
    try {
      this.db
        .prepare('INSERT INTO used_token (token, action, used_at) VALUES (?, ?, ?)')
        .run(token, action, now);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        throw new TokenAlreadyUsedError();
      }
      throw error;
    }
  }

  isTokenUsed(token: string): boolean {
    const row = this.db.prepare('SELECT token FROM used_token WHERE token = ?').get(token);
    return !!row;
  }

  // ===== MAPPERS =====

  private mapProjectFromDb(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapIdeaFromDb(row: any): Idea {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      promotedAt: row.promoted_at,
      abandonedAt: row.abandoned_at,
    };
  }

  private mapPhaseFromDb(row: any): Phase {
    return {
      id: row.id,
      title: row.title,
      objective: row.objective,
      status: row.status,
      sourceIdeaId: row.source_idea_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
    };
  }

  private mapDocumentFromDb(row: any): Document {
    return {
      id: row.id,
      phaseId: row.phase_id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDecisionFromDb(row: any): Decision {
    return {
      id: row.id,
      phaseId: row.phase_id,
      title: row.title,
      statement: row.statement,
      rationale: row.rationale,
      status: row.status,
      contentHash: row.content_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lockedAt: row.locked_at,
    };
  }

  private mapTaskFromDb(row: any): Task {
    return {
      id: row.id,
      decisionId: row.decision_id,
      phaseId: row.phase_id,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      voidedAt: row.voided_at,
    };
  }

  private mapSnapshotFromDb(row: any): DocumentSnapshot {
    return {
      id: row.id,
      phaseId: row.phase_id,
      originalDocumentId: row.original_document_id,
      title: row.title,
      content: row.content,
      contentHash: row.content_hash,
      createdAt: row.created_at,
    };
  }

  private mapAuditLogFromDb(row: any): AuditLogEntry {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      oldState: row.old_state,
      newState: row.new_state,
      details: row.details,
      createdAt: row.created_at,
    };
  }
}
