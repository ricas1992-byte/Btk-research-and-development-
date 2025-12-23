/**
 * Task Service
 * Section 4.2: S2 Service Implementation
 */

import { Task } from '../entities/Task.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { DecisionRepository } from '../repositories/DecisionRepository.js';

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private decisionRepo: DecisionRepository
  ) {}

  /**
   * Create task from decision
   *
   * Per Section 0.5.3: "Can only be created from a LOCKED decision"
   * ENF-03: Task from locked decision only.
   */
  createTask(params: { decision_id: string; title: string; description: string }): Task {
    const decision = this.decisionRepo.findById(params.decision_id);
    if (!decision) {
      throw new Error(`Decision ${params.decision_id} not found`);
    }

    if (!decision.isLocked()) {
      throw new Error('Cannot create task from unlocked decision (ENF-03)');
    }

    const task = Task.create(params);
    return this.taskRepo.create(task);
  }

  getTask(id: string): Task | null {
    return this.taskRepo.findById(id);
  }

  getTasksByDecision(decisionId: string): Task[] {
    return this.taskRepo.findByDecisionId(decisionId);
  }

  updateTask(id: string, params: { title?: string; description?: string }): Task {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const updated = task.update(params);
    return this.taskRepo.update(updated);
  }

  startTask(id: string): Task {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const started = task.start();
    return this.taskRepo.update(started);
  }

  completeTask(id: string): Task {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const completed = task.complete();
    return this.taskRepo.update(completed);
  }

  cancelTask(id: string): Task {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const cancelled = task.cancel();
    return this.taskRepo.update(cancelled);
  }

  pauseTask(id: string): Task {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const paused = task.pause();
    return this.taskRepo.update(paused);
  }
}
