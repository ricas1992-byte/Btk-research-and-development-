import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { Enforcer } from '../../domain/services/Enforcer.js';
import { PhaseService } from '../../domain/services/PhaseService.js';
import { PhaseRepository } from '../../domain/repositories/PhaseRepository.js';
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
// Enforces ENF-01: Single Active Phase Constraint
ideasRouter.post('/:id/promote', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const enforcer = new Enforcer(db);
    const phaseRepo = new PhaseRepository(db);
    const phaseService = new PhaseService(phaseRepo);

    // ENF-01: Ensure no active phase exists
    enforcer.enforceNoActivePhase();

    const idea = gateway.getIdea(id);
    validateIdeaTransition(idea.status, 'PROMOTED');

    // Update idea and create phase using S2 services
    const updatedIdea = gateway.updateIdeaStatus(id, 'PROMOTED');
    const phase = phaseService.createPhase({
      name: idea.title,
      description: idea.description
    });

    // Log to audit trail
    enforcer.logEntityCreation('Phase', phase.id, {
      source_idea_id: idea.id,
      status: phase.status
    });

    res.json({ idea: updatedIdea, phase });
  } catch (error: any) {
    if (error.message && error.message.includes('ENF-')) {
      const ruleMatch = error.message.match(/ENF-\d+/);
      return res.status(403).json({
        error: {
          code: 'ENFORCEMENT_VIOLATION',
          message: error.message,
          rule: ruleMatch ? ruleMatch[0] : undefined,
        },
      });
    }
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
