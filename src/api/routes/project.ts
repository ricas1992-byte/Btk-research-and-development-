import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { validateProjectName } from '../../core/state-validator.js';

export const projectRouter = Router();

// GET /api/project
projectRouter.get('/', (_req, res, next) => {
  try {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const project = gateway.getProject();
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/project
projectRouter.patch('/', (req, res, next) => {
  try {
    const { name } = req.body;
    validateProjectName(name);

    const db = getDatabase();
    const gateway = new Gateway(db);
    const project = gateway.updateProject(name);
    res.json(project);
  } catch (error) {
    next(error);
  }
});
