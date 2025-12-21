/**
 * TaskRepository Integration Tests
 * Section 4.2: S2 Repository Tests with Hash Verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskRepository } from '../../../src/domain/repositories/TaskRepository.js';
import { Task } from '../../../src/domain/entities/Task.js';
import { Decision } from '../../../src/domain/entities/Decision.js';
import { DecisionRepository } from '../../../src/domain/repositories/DecisionRepository.js';
import { Phase } from '../../../src/domain/entities/Phase.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDb, initializeDatabase, closeDatabase } from '../../../src/db/connection.js';
import { HashVerificationError } from '../../../src/core/verification.js';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let testDecisionId: string;

  beforeEach(() => {
    initializeDatabase(':memory:');
    repository = new TaskRepository(getDb());

    const phaseRepo = new PhaseRepository(getDb());
    const phase = Phase.create({
      name: 'Test Phase',
      description: 'Description',
    });
    phaseRepo.create(phase);

    const decisionRepo = new DecisionRepository(getDb());
    const decision = Decision.create({
      phase_id: phase.id,
      content: 'Test decision',
    });
    decisionRepo.create(decision);
    testDecisionId = decision.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('create', () => {
    it('should persist task to database', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Description',
      });

      const created = repository.create(task);

      expect(created.id).toBe(task.id);
      expect(created.title).toBe(task.title);
      expect(created.content_hash).toBe(task.content_hash);
    });

    it('should store correct hash in database', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Description',
      });

      repository.create(task);

      const retrieved = repository.findById(task.id);
      expect(retrieved?.content_hash).toBe(task.content_hash);
    });
  });

  describe('findById', () => {
    it('should retrieve task by id', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Description',
      });

      repository.create(task);

      const retrieved = repository.findById(task.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(task.id);
      expect(retrieved!.title).toBe('Test Task');
    });

    it('should return null for non-existent id', () => {
      const retrieved = repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should verify hash on read (PROOF-07)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Description',
      });

      repository.create(task);

      const db = getDb();
      db.prepare('UPDATE tasks SET content_hash = ? WHERE id = ?').run('wrong-hash', task.id);

      expect(() => repository.findById(task.id)).toThrow(HashVerificationError);
    });
  });

  describe('findByDecisionId', () => {
    it('should return empty array when no tasks exist', () => {
      const tasks = repository.findByDecisionId(testDecisionId);

      expect(tasks).toEqual([]);
    });

    it('should return all tasks for decision', () => {
      const task1 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description 1',
      });

      const task2 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description 2',
      });

      repository.create(task1);
      repository.create(task2);

      const tasks = repository.findByDecisionId(testDecisionId);

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain(task1.id);
      expect(tasks.map((t) => t.id)).toContain(task2.id);
    });

    it('should only return tasks for specified decision', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      repository.create(task);

      const tasks = repository.findByDecisionId('other-decision-id');

      expect(tasks).toHaveLength(0);
    });

    it('should verify hash on all reads', () => {
      const task1 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description',
      });

      const task2 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description',
      });

      repository.create(task1);
      repository.create(task2);

      const db = getDb();
      db.prepare('UPDATE tasks SET content_hash = ? WHERE id = ?').run('wrong-hash', task1.id);

      expect(() => repository.findByDecisionId(testDecisionId)).toThrow(HashVerificationError);
    });
  });

  describe('update', () => {
    it('should update task in database', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Description',
      });

      repository.create(task);

      const updated = task.update({ title: 'New Title' });
      repository.update(updated);

      const retrieved = repository.findById(task.id);

      expect(retrieved!.title).toBe('New Title');
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should recompute and store new hash', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original',
        description: 'Description',
      });

      repository.create(task);

      const originalHash = task.content_hash;

      const updated = task.update({ title: 'Updated' });
      repository.update(updated);

      const retrieved = repository.findById(task.id);

      expect(retrieved!.content_hash).not.toBe(originalHash);
      expect(retrieved!.content_hash).toBe(updated.content_hash);
    });

    it('should update status', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      repository.create(task);

      const started = task.start();
      repository.update(started);

      const retrieved = repository.findById(task.id);

      expect(retrieved!.status).toBe('IN_PROGRESS');
    });
  });

  describe('hash verification integrity (PROOF-07)', () => {
    it('should detect corrupted title field', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Description',
      });

      repository.create(task);

      const db = getDb();
      db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run('Tampered Title', task.id);

      expect(() => repository.findById(task.id)).toThrow(HashVerificationError);
    });

    it('should detect corrupted description field', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Title',
        description: 'Original Description',
      });

      repository.create(task);

      const db = getDb();
      db.prepare('UPDATE tasks SET description = ? WHERE id = ?').run(
        'Tampered Description',
        task.id
      );

      expect(() => repository.findById(task.id)).toThrow(HashVerificationError);
    });

    it('should detect corrupted hash field', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      repository.create(task);

      const db = getDb();
      db.prepare('UPDATE tasks SET content_hash = ? WHERE id = ?').run('corrupted-hash', task.id);

      expect(() => repository.findById(task.id)).toThrow(HashVerificationError);
    });

    it('should pass verification with correct data', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Test Description',
      });

      repository.create(task);

      const retrieved = repository.findById(task.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Test Task');
      expect(retrieved!.description).toBe('Test Description');
    });

    it('should verify on findByDecisionId', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      repository.create(task);

      const db = getDb();
      db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run('Tampered', task.id);

      expect(() => repository.findByDecisionId(testDecisionId)).toThrow(HashVerificationError);
    });
  });
});
