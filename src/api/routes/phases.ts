import { Router } from 'express';
import { getDatabase } from '../../db/connection.js';
import { Enforcer } from '../../domain/services/Enforcer.js';
import { PhaseService } from '../../domain/services/PhaseService.js';
import { PhaseRepository } from '../../domain/repositories/PhaseRepository.js';
import { Phase } from '../../domain/entities/Phase.js';

export const phasesRouter = Router();

/**
 * Error handler for enforcement violations
 */
function handleEnforcementError(error: any, res: any) {
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

// GET /api/phases/active
phasesRouter.get('/active', (_req, res, next) => {
  try {
    const db = getDatabase();
    const phaseRepo = new PhaseRepository(db);

    const phase = phaseRepo.findActive();
    if (!phase) {
      res.status(404).json({
        error: {
          code: 'E1002',
          message: 'No active phase found'
        }
      });
      return;
    }
    res.json(phase);
  } catch (error) {
    next(error);
  }
});

// GET /api/phases/completed
phasesRouter.get('/completed', (_req, res, next) => {
  try {
    const db = getDatabase();
    const phaseRepo = new PhaseRepository(db);
    const phases = phaseRepo.findAll().filter((p: Phase) =>
      p.status === 'COMPLETED' || p.status === 'ABANDONED'
    );
    res.json(phases);
  } catch (error) {
    next(error);
  }
});

// GET /api/phases/:id
phasesRouter.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const phaseRepo = new PhaseRepository(db);

    const phase = phaseRepo.findById(id);
    if (!phase) {
      res.status(404).json({
        error: {
          code: 'E1002',
          message: `Phase ${id} not found`
        }
      });
      return;
    }
    res.json(phase);
  } catch (error) {
    next(error);
  }
});

// POST /api/phases
phasesRouter.post('/', (req, res, next) => {
  try {
    const { name, description } = req.body;

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const phaseRepo = new PhaseRepository(db);
    const phaseService = new PhaseService(phaseRepo);

    // ENF-01: Enforce single active phase constraint
    enforcer.enforceNoActivePhase();

    // Create phase
    const phase = phaseService.createPhase({ name, description });

    // Log to audit trail
    enforcer.logEntityCreation('Phase', phase.id, {
      name: phase.name,
      description: phase.description,
    });

    res.status(201).json(phase);
  } catch (error: any) {
    if (!handleEnforcementError(error, res)) {
      next(error);
    }
  }
});

// PUT /api/phases/:id
phasesRouter.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const phaseRepo = new PhaseRepository(db);
    const phaseService = new PhaseService(phaseRepo);

    const phase = phaseRepo.findById(id);
    if (!phase) {
      res.status(404).json({
        error: {
          code: 'E1002',
          message: `Phase ${id} not found`
        }
      });
      return;
    }

    // ENF-06: Enforce phase not in terminal state
    enforcer.enforcePhaseNotTerminal(phase);

    // Update phase
    const updated = phaseService.updatePhase(id, { name, description });

    // Log to audit trail
    enforcer.logEntityUpdate('Phase', id, {
      name: updated.name,
      description: updated.description,
    });

    res.json(updated);
  } catch (error: any) {
    if (!handleEnforcementError(error, res)) {
      next(error);
    }
  }
});

// POST /api/phases/:id/complete
phasesRouter.post('/:id/complete', (req, res, next) => {
  try {
    const { id } = req.params;

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const phaseRepo = new PhaseRepository(db);
    const phaseService = new PhaseService(phaseRepo);

    const phase = phaseRepo.findById(id);
    if (!phase) {
      res.status(404).json({
        error: {
          code: 'E1002',
          message: `Phase ${id} not found`
        }
      });
      return;
    }

    // Enforce state transition
    enforcer.enforcePhaseTransition(phase, 'COMPLETED');

    // Complete phase
    const completed = phaseService.completePhase(id);

    res.json(completed);
  } catch (error: any) {
    if (!handleEnforcementError(error, res)) {
      next(error);
    }
  }
});

// POST /api/phases/:id/abandon
phasesRouter.post('/:id/abandon', (req, res, next) => {
  try {
    const { id } = req.params;

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const phaseRepo = new PhaseRepository(db);
    const phaseService = new PhaseService(phaseRepo);

    const phase = phaseRepo.findById(id);
    if (!phase) {
      res.status(404).json({
        error: {
          code: 'E1002',
          message: `Phase ${id} not found`
        }
      });
      return;
    }

    // Enforce state transition
    enforcer.enforcePhaseTransition(phase, 'ABANDONED');

    // Abandon phase
    const abandoned = phaseService.abandonPhase(id);

    res.json(abandoned);
  } catch (error: any) {
    if (!handleEnforcementError(error, res)) {
      next(error);
    }
  }
});
