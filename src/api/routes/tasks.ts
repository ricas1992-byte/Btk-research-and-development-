import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Enforcer } from '../../domain/services/Enforcer.js';
import { TaskService } from '../../domain/services/TaskService.js';
import { TaskRepository } from '../../domain/repositories/TaskRepository.js';
import { DecisionRepository } from '../../domain/repositories/DecisionRepository.js';
import { validateTaskTransition } from '../../core/state-machines/task.js';

export const tasksRouter = Router();

/**
 * Helper function to handle enforcement errors
 * Returns true if error was an enforcement violation
 */
function handleEnforcementError(error: any, res: any): boolean {
  if (error.message && error.message.includes('ENF-')) {
    const ruleMatch = error.message.match(/ENF-\d+/);
    res.status(403).json({
      error: {
        code: 'ENFORCEMENT_VIOLATION',
        message: error.message,
        rule: ruleMatch ? ruleMatch[0] : undefined,
      },
    });
    return true;
  }
  return false;
}

// GET /api/tasks?decision_id=x
tasksRouter.get('/', (req, res, next) => {
  try {
    const decision_id = req.query.decision_id as string | undefined;

    const db = getDatabase();
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    const tasks = decision_id
      ? taskService.getTasksByDecision(decision_id)
      : [];

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
// Enforces ENF-03: Task from Locked Decision Only
tasksRouter.post('/', (req, res, next) => {
  try {
    const { decision_id, title, description = '' } = req.body;

    if (!decision_id || typeof decision_id !== 'string') {
      return res.status(400).json({ error: 'decision_id is required' });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and cannot be empty' });
    }

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    // Get decision to check if it exists and is locked
    const decision = decisionRepo.findById(decision_id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // ENF-03: Ensure decision is LOCKED
    enforcer.enforceDecisionIsLocked(decision);

    // Create task (service layer also checks ENF-03)
    const task = taskService.createTask({ decision_id, title, description });

    // Log to audit trail
    enforcer.logEntityCreation('Task', task.id, {
      decision_id,
      status: task.status,
    });

    res.status(201).json(task);
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});

// POST /api/tasks/:id/start
// Validates PENDING → IN_PROGRESS state transition
tasksRouter.post('/:id/start', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    // Get existing task
    const task = taskService.getTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate state transition
    validateTaskTransition(task.status, 'IN_PROGRESS');

    // Start task (PENDING → IN_PROGRESS)
    const started = taskService.startTask(id);

    // Log to audit trail
    enforcer.logEntityUpdate('Task', id, {
      old_status: task.status,
      new_status: started.status,
      action: 'STARTED',
    });

    res.json(started);
  } catch (error: any) {
    if (error.message?.includes('Invalid transition')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }
    next(error);
  }
});

// POST /api/tasks/:id/complete
// Validates IN_PROGRESS → COMPLETED state transition
tasksRouter.post('/:id/complete', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    // Get existing task
    const task = taskService.getTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate state transition
    validateTaskTransition(task.status, 'COMPLETED');

    // Complete task (IN_PROGRESS → COMPLETED)
    const completed = taskService.completeTask(id);

    // Log to audit trail
    enforcer.logEntityUpdate('Task', id, {
      old_status: task.status,
      new_status: completed.status,
      action: 'COMPLETED',
    });

    res.json(completed);
  } catch (error: any) {
    if (error.message?.includes('Invalid transition') || error.message?.includes('Cannot complete')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }
    next(error);
  }
});

// POST /api/tasks/:id/cancel
// Validates PENDING or IN_PROGRESS → CANCELLED state transition
tasksRouter.post('/:id/cancel', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    // Get existing task
    const task = taskService.getTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate state transition
    validateTaskTransition(task.status, 'CANCELLED');

    // Cancel task (PENDING or IN_PROGRESS → CANCELLED)
    const cancelled = taskService.cancelTask(id);

    // Log to audit trail
    enforcer.logEntityUpdate('Task', id, {
      old_status: task.status,
      new_status: cancelled.status,
      action: 'CANCELLED',
    });

    res.json(cancelled);
  } catch (error: any) {
    if (error.message?.includes('Invalid transition') || error.message?.includes('Cannot cancel')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }
    next(error);
  }
});

// POST /api/tasks/:id/pause
// Validates IN_PROGRESS → PENDING state transition
tasksRouter.post('/:id/pause', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const taskRepo = new TaskRepository(db);
    const decisionRepo = new DecisionRepository(db);
    const taskService = new TaskService(taskRepo, decisionRepo);

    // Get existing task
    const task = taskService.getTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate state transition
    validateTaskTransition(task.status, 'PENDING');

    // Pause task (IN_PROGRESS → PENDING)
    const paused = taskService.pauseTask(id);

    // Log to audit trail
    enforcer.logEntityUpdate('Task', id, {
      old_status: task.status,
      new_status: paused.status,
      action: 'PAUSED',
    });

    res.json(paused);
  } catch (error: any) {
    if (error.message?.includes('Invalid transition') || error.message?.includes('Cannot pause')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }
    next(error);
  }
});
