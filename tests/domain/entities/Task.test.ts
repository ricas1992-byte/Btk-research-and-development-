/**
 * Task Entity Tests
 * Section 4.2: S2 Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { Task } from '../../../src/domain/entities/Task.js';
import { computeTaskHash } from '../../../src/core/hash.js';

describe('Task Entity', () => {
  const testDecisionId = 'decision-123';

  describe('factory method', () => {
    it('should create task with PENDING status', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Test Description',
      });

      expect(task.id).toBeDefined();
      expect(task.decision_id).toBe(testDecisionId);
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.status).toBe('PENDING');
      expect(task.created_at).toBeDefined();
      expect(task.updated_at).toBeDefined();
      expect(task.content_hash).toBeDefined();
    });

    it('should compute correct hash on creation', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Test Description',
      });

      const expectedHash = computeTaskHash(testDecisionId, 'Test Task', 'Test Description');
      expect(task.content_hash).toBe(expectedHash);
    });
  });

  describe('update method', () => {
    it('should update title and recompute hash', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Description',
      });

      const updated = task.update({ title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('Description');
      expect(updated.content_hash).not.toBe(task.content_hash);
    });

    it('should update description and recompute hash', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Title',
        description: 'Original Description',
      });

      const updated = task.update({ description: 'New Description' });

      expect(updated.title).toBe('Title');
      expect(updated.description).toBe('New Description');
      expect(updated.content_hash).not.toBe(task.content_hash);
    });

    it('should update both fields and recompute hash', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Original Description',
      });

      const updated = task.update({
        title: 'New Title',
        description: 'New Description',
      });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
      expect(updated.content_hash).not.toBe(task.content_hash);

      const expectedHash = computeTaskHash(testDecisionId, 'New Title', 'New Description');
      expect(updated.content_hash).toBe(expectedHash);
    });

    it('should return new instance (immutability)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Original',
        description: 'Description',
      });

      const updated = task.update({ title: 'Updated' });

      expect(updated).not.toBe(task);
      expect(task.title).toBe('Original');
      expect(updated.title).toBe('Updated');
    });
  });

  describe('start method', () => {
    it('should transition PENDING to IN_PROGRESS', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();

      expect(started.status).toBe('IN_PROGRESS');
      expect(started.id).toBe(task.id);
    });

    it('should throw if not in PENDING status', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();

      expect(() => started.start()).toThrow('Task must be PENDING to start');
    });

    it('should return new instance (immutability)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();

      expect(started).not.toBe(task);
      expect(task.status).toBe('PENDING');
      expect(started.status).toBe('IN_PROGRESS');
    });
  });

  describe('complete method', () => {
    it('should transition IN_PROGRESS to COMPLETED', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      const completed = started.complete();

      expect(completed.status).toBe('COMPLETED');
      expect(completed.id).toBe(task.id);
    });

    it('should throw if not in IN_PROGRESS status', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      expect(() => task.complete()).toThrow('Task must be IN_PROGRESS to complete');
    });

    it('should throw if already COMPLETED', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const completed = task.start().complete();

      expect(() => completed.complete()).toThrow('Task must be IN_PROGRESS to complete');
    });

    it('should return new instance (immutability)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      const completed = started.complete();

      expect(completed).not.toBe(started);
      expect(started.status).toBe('IN_PROGRESS');
      expect(completed.status).toBe('COMPLETED');
    });
  });

  describe('cancel method', () => {
    it('should transition PENDING to CANCELLED', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const cancelled = task.cancel();

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.id).toBe(task.id);
    });

    it('should transition IN_PROGRESS to CANCELLED', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      const cancelled = started.cancel();

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw if already in terminal state', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const completed = task.start().complete();

      expect(() => completed.cancel()).toThrow('Cannot cancel task in terminal state');
    });

    it('should return new instance (immutability)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const cancelled = task.cancel();

      expect(cancelled).not.toBe(task);
      expect(task.status).toBe('PENDING');
      expect(cancelled.status).toBe('CANCELLED');
    });
  });

  describe('pause method', () => {
    it('should transition IN_PROGRESS to PENDING', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      const paused = started.pause();

      expect(paused.status).toBe('PENDING');
      expect(paused.id).toBe(task.id);
    });

    it('should throw if not IN_PROGRESS', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      expect(() => task.pause()).toThrow('Task must be IN_PROGRESS to pause');
    });

    it('should return new instance (immutability)', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      const paused = started.pause();

      expect(paused).not.toBe(started);
      expect(started.status).toBe('IN_PROGRESS');
      expect(paused.status).toBe('PENDING');
    });
  });

  describe('fromDatabase method', () => {
    it('should reconstruct task from database row', () => {
      const dbRow = {
        id: 'test-id',
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        content_hash: 'test-hash',
      };

      const task = Task.fromDatabase(dbRow);

      expect(task.id).toBe('test-id');
      expect(task.decision_id).toBe(testDecisionId);
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.status).toBe('PENDING');
      expect(task.content_hash).toBe('test-hash');
    });
  });

  describe('state machine', () => {
    it('should follow complete workflow: PENDING → IN_PROGRESS → COMPLETED', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      expect(task.status).toBe('PENDING');

      const started = task.start();
      expect(started.status).toBe('IN_PROGRESS');

      const completed = started.complete();
      expect(completed.status).toBe('COMPLETED');
    });

    it('should support pause workflow: PENDING → IN_PROGRESS → PENDING', () => {
      const task = Task.create({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = task.start();
      expect(started.status).toBe('IN_PROGRESS');

      const paused = started.pause();
      expect(paused.status).toBe('PENDING');

      const restarted = paused.start();
      expect(restarted.status).toBe('IN_PROGRESS');
    });

    it('should support cancel workflow from any non-terminal state', () => {
      const task1 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description',
      });

      const cancelled1 = task1.cancel();
      expect(cancelled1.status).toBe('CANCELLED');

      const task2 = Task.create({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description',
      });

      const started = task2.start();
      const cancelled2 = started.cancel();
      expect(cancelled2.status).toBe('CANCELLED');
    });
  });
});
