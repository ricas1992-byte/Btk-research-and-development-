/**
 * Task Repository
 * Section 4.2: S2 Repository Implementation
 */

import type Database from 'better-sqlite3';
import { Task } from '../entities/Task.js';
import { verifyTaskHashOrThrow } from '../../core/verification.js';
import type { Task as TaskType } from '../../core/types.js';

export class TaskRepository {
  constructor(private db: Database.Database) {}

  create(task: Task): Task {
    const stmt = this.db.prepare(`
      INSERT INTO task (id, decision_id, title, description, status, created_at, updated_at, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.decision_id,
      task.title,
      task.description,
      task.status,
      task.created_at,
      task.updated_at,
      task.content_hash
    );

    return task;
  }

  findById(id: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM task WHERE id = ?');
    const row = stmt.get(id) as TaskType | undefined;

    if (!row) {
      return null;
    }

    const task = Task.fromDatabase(row);
    verifyTaskHashOrThrow(task);

    return task;
  }

  findByDecisionId(decisionId: string): Task[] {
    const stmt = this.db.prepare('SELECT * FROM task WHERE decision_id = ? ORDER BY created_at');
    const rows = stmt.all(decisionId) as TaskType[];

    return rows.map((row) => {
      const task = Task.fromDatabase(row);
      verifyTaskHashOrThrow(task);
      return task;
    });
  }

  update(task: Task): Task {
    const stmt = this.db.prepare(`
      UPDATE task
      SET title = ?, description = ?, status = ?, updated_at = ?, content_hash = ?
      WHERE id = ?
    `);

    stmt.run(task.title, task.description, task.status, task.updated_at, task.content_hash, task.id);

    return task;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM task WHERE id = ?');
    stmt.run(id);
  }
}
