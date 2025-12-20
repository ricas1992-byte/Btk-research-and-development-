import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { InvariantChecker } from '../../core/invariant-checker.js';
import { validateTitle, validateDescription } from '../../core/state-validator.js';
import { validateTaskTransition } from '../../core/state-machines/task.js';

export const tasksRouter = Router();

// GET /api/tasks?phaseId=x or ?decisionId=x
tasksRouter.get('/', (req, res, next) => {
  try {
    const phaseId = req.query.phaseId as string | undefined;
    const decisionId = req.query.decisionId as string | undefined;

    const db = getDatabase();
    const gateway = new Gateway(db);
    const tasks = gateway.getTasks({ phaseId, decisionId });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
tasksRouter.post('/', (req, res, next) => {
  try {
    const { decisionId, title, description = '' } = req.body;
    validateTitle(title);
    validateDescription(description);

    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // MA-03: Ensure decision is LOCKED
    checker.ensureDecisionIsLocked(decisionId);

    const decision = gateway.getDecision(decisionId);
    const task = gateway.createTask(decisionId, decision.phaseId, title, description);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/:id/complete
tasksRouter.post('/:id/complete', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const task = gateway.getTask(id);
    validateTaskTransition(task.status, 'COMPLETED');

    checker.ensureTaskIsPending(id);

    const updatedTask = gateway.updateTaskStatus(id, 'COMPLETED');
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/:id/void
tasksRouter.post('/:id/void', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const task = gateway.getTask(id);
    validateTaskTransition(task.status, 'VOIDED');

    checker.ensureTaskIsPending(id);

    const updatedTask = gateway.updateTaskStatus(id, 'VOIDED');
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});
