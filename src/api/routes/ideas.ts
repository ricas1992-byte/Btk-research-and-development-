import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { InvariantChecker } from '../../core/invariant-checker.js';
import { validateTitle, validateDescription } from '../../core/state-validator.js';
import { validateIdeaTransition } from '../../core/state-machines/idea.js';
import { IdeaStatus } from '../../types/entities.js';

export const ideasRouter = Router();

// GET /api/ideas?status=PARKED
ideasRouter.get('/', (req, res, next) => {
  try {
    const status = req.query.status as IdeaStatus | undefined;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const ideas = gateway.getIdeas(status);
    res.json(ideas);
  } catch (error) {
    next(error);
  }
});

// POST /api/ideas
ideasRouter.post('/', (req, res, next) => {
  try {
    const { title, description = '' } = req.body;
    validateTitle(title);
    validateDescription(description);

    const db = getDatabase();
    const gateway = new Gateway(db);
    const idea = gateway.createIdea(title, description);
    res.status(201).json(idea);
  } catch (error) {
    next(error);
  }
});

// POST /api/ideas/:id/promote
ideasRouter.post('/:id/promote', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // MA-01: Ensure no active phase exists
    checker.ensureNoActivePhase();

    const idea = gateway.getIdea(id);
    validateIdeaTransition(idea.status, 'PROMOTED');

    // Update idea and create phase
    const updatedIdea = gateway.updateIdeaStatus(id, 'PROMOTED');
    const phase = gateway.createPhase(idea.title, idea.description, idea.id);

    res.json({ idea: updatedIdea, phase });
  } catch (error) {
    next(error);
  }
});

// POST /api/ideas/:id/abandon
ideasRouter.post('/:id/abandon', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);

    const idea = gateway.getIdea(id);
    validateIdeaTransition(idea.status, 'ABANDONED');

    const updatedIdea = gateway.updateIdeaStatus(id, 'ABANDONED');
    res.json(updatedIdea);
  } catch (error) {
    next(error);
  }
});
