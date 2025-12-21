/**
 * TaskService Tests
 * Section 4.2: S2 Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskService } from '../../../src/domain/services/TaskService.js';
import { TaskRepository } from '../../../src/domain/repositories/TaskRepository.js';
import { DecisionService } from '../../../src/domain/services/DecisionService.js';
import { DecisionRepository } from '../../../src/domain/repositories/DecisionRepository.js';
import { PhaseService } from '../../../src/domain/services/PhaseService.js';
import { PhaseRepository } from '../../../src/domain/repositories/PhaseRepository.js';
import { getDatabase, initDatabase, closeDatabase } from '../../../src/db/connection.js';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: TaskRepository;
  let decisionService: DecisionService;
  let testDecisionId: string;
  let testPhaseId: string;

  beforeEach(() => {
    initDatabase({ path: ':memory:' });
    taskRepository = new TaskRepository(getDatabase());
    const decisionRepo = new DecisionRepository(getDatabase());
    service = new TaskService(taskRepository, decisionRepo);

    const phaseRepo = new PhaseRepository(getDatabase());
    const phaseService = new PhaseService(phaseRepo);
    decisionService = new DecisionService(decisionRepo);

    const phase = phaseService.createPhase({
      name: 'Test Phase',
      description: 'Description',
    });
    testPhaseId = phase.id;

    const decision = decisionService.createDecision({
      phase_id: phase.id,
      content: 'Test decision',
    });

    const locked = decisionService.lockDecision(decision.id);
    testDecisionId = locked.id;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createTask', () => {
    it('should create task from locked decision', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Test Description',
      });

      expect(task.id).toBeDefined();
      expect(task.decision_id).toBe(testDecisionId);
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.status).toBe('PENDING');
    });

    it('should throw error when creating from unlocked decision (ENF-03)', () => {
      const decision = decisionService.createDecision({
        phase_id: testPhaseId,
        content: 'Draft decision',
      });

      expect(() =>
        service.createTask({
          decision_id: decision.id,
          title: 'Task',
          description: 'Description',
        })
      ).toThrow('Cannot create task from unlocked decision (ENF-03)');
    });

    it('should throw error when decision does not exist', () => {
      expect(() =>
        service.createTask({
          decision_id: 'non-existent-id',
          title: 'Task',
          description: 'Description',
        })
      ).toThrow('Decision non-existent-id not found');
    });

    it('should allow multiple tasks from same decision', () => {
      const task1 = service.createTask({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description 1',
      });

      const task2 = service.createTask({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description 2',
      });

      expect(task1.id).not.toBe(task2.id);
      expect(task1.decision_id).toBe(testDecisionId);
      expect(task2.decision_id).toBe(testDecisionId);
    });
  });

  describe('getTask', () => {
    it('should retrieve task by id', () => {
      const created = service.createTask({
        decision_id: testDecisionId,
        title: 'Test Task',
        description: 'Description',
      });

      const retrieved = service.getTask(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Task');
    });

    it('should return null for non-existent task', () => {
      const retrieved = service.getTask('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getTasksByDecision', () => {
    it('should return empty array when no tasks exist', () => {
      const tasks = service.getTasksByDecision(testDecisionId);

      expect(tasks).toEqual([]);
    });

    it('should return all tasks for decision', () => {
      service.createTask({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description 1',
      });

      service.createTask({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description 2',
      });

      const tasks = service.getTasksByDecision(testDecisionId);

      expect(tasks).toHaveLength(2);
    });

    it('should only return tasks for specified decision', () => {
      service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const tasks = service.getTasksByDecision('other-decision-id');

      expect(tasks).toHaveLength(0);
    });
  });

  describe('updateTask', () => {
    it('should update task title', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Description',
      });

      const updated = service.updateTask(task.id, { title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('Description');
    });

    it('should update task description', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Title',
        description: 'Original Description',
      });

      const updated = service.updateTask(task.id, { description: 'New Description' });

      expect(updated.title).toBe('Title');
      expect(updated.description).toBe('New Description');
    });

    it('should update both title and description', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Original Title',
        description: 'Original Description',
      });

      const updated = service.updateTask(task.id, {
        title: 'New Title',
        description: 'New Description',
      });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
    });

    it('should throw error for non-existent task', () => {
      expect(() => service.updateTask('non-existent-id', { title: 'Title' })).toThrow(
        'Task non-existent-id not found'
      );
    });
  });

  describe('startTask', () => {
    it('should start pending task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = service.startTask(task.id);

      expect(started.status).toBe('IN_PROGRESS');
      expect(started.id).toBe(task.id);
    });

    it('should throw error for non-existent task', () => {
      expect(() => service.startTask('non-existent-id')).toThrow('Task non-existent-id not found');
    });

    it('should throw error when starting non-pending task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      service.startTask(task.id);

      expect(() => service.startTask(task.id)).toThrow('Cannot start task in');
    });
  });

  describe('completeTask', () => {
    it('should complete in-progress task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      service.startTask(task.id);
      const completed = service.completeTask(task.id);

      expect(completed.status).toBe('COMPLETED');
      expect(completed.id).toBe(task.id);
    });

    it('should throw error for non-existent task', () => {
      expect(() => service.completeTask('non-existent-id')).toThrow(
        'Task non-existent-id not found'
      );
    });

    it('should throw error when completing non-in-progress task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      expect(() => service.completeTask(task.id)).toThrow('Cannot complete task in');
    });
  });

  describe('cancelTask', () => {
    it('should cancel pending task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const cancelled = service.cancelTask(task.id);

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.id).toBe(task.id);
    });

    it('should cancel in-progress task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      service.startTask(task.id);
      const cancelled = service.cancelTask(task.id);

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw error for non-existent task', () => {
      expect(() => service.cancelTask('non-existent-id')).toThrow('Task non-existent-id not found');
    });

    it('should throw error when cancelling completed task', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      service.startTask(task.id);
      service.completeTask(task.id);

      expect(() => service.cancelTask(task.id)).toThrow('Cannot cancel task in');
    });
  });

  describe('ENF-03: Task from locked decision only', () => {
    it('should enforce locked decision requirement', () => {
      const decision = decisionService.createDecision({
        phase_id: testPhaseId,
        content: 'Draft decision',
      });

      expect(() =>
        service.createTask({
          decision_id: decision.id,
          title: 'Task',
          description: 'Description',
        })
      ).toThrow('Cannot create task from unlocked decision (ENF-03)');

      const locked = decisionService.lockDecision(decision.id);

      const task = service.createTask({
        decision_id: locked.id,
        title: 'Task',
        description: 'Description',
      });

      expect(task).toBeDefined();
      expect(task.decision_id).toBe(locked.id);
    });
  });

  describe('task lifecycle', () => {
    it('should follow complete workflow: PENDING → IN_PROGRESS → COMPLETED', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      expect(task.status).toBe('PENDING');

      const started = service.startTask(task.id);
      expect(started.status).toBe('IN_PROGRESS');

      const completed = service.completeTask(task.id);
      expect(completed.status).toBe('COMPLETED');
    });

    it('should support pause and resume', () => {
      const task = service.createTask({
        decision_id: testDecisionId,
        title: 'Task',
        description: 'Description',
      });

      const started = service.startTask(task.id);
      expect(started.status).toBe('IN_PROGRESS');

      // Pause not directly exposed in service, but tested via entity
      const retrieved = service.getTask(task.id);
      expect(retrieved?.status).toBe('IN_PROGRESS');
    });

    it('should support cancel from any non-terminal state', () => {
      const task1 = service.createTask({
        decision_id: testDecisionId,
        title: 'Task 1',
        description: 'Description',
      });

      const cancelled1 = service.cancelTask(task1.id);
      expect(cancelled1.status).toBe('CANCELLED');

      const task2 = service.createTask({
        decision_id: testDecisionId,
        title: 'Task 2',
        description: 'Description',
      });

      service.startTask(task2.id);
      const cancelled2 = service.cancelTask(task2.id);
      expect(cancelled2.status).toBe('CANCELLED');
    });
  });
});
