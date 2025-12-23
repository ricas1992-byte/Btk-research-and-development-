import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Enforcer } from '../../domain/services/Enforcer.js';
import { DecisionService } from '../../domain/services/DecisionService.js';
import { DecisionRepository } from '../../domain/repositories/DecisionRepository.js';
import { PhaseRepository } from '../../domain/repositories/PhaseRepository.js';
import { validateDecisionTransition } from '../../core/state-machines/decision.js';

export const decisionsRouter = Router();

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

// GET /api/decisions?phase_id=x
decisionsRouter.get('/', (req, res, next) => {
  try {
    const phase_id = req.query.phase_id as string | undefined;
    const db = getDatabase();
    const decisionRepo = new DecisionRepository(db);
    const decisionService = new DecisionService(decisionRepo);

    const decisions = phase_id
      ? decisionService.getDecisionsByPhase(phase_id)
      : [];

    res.json(decisions);
  } catch (error) {
    next(error);
  }
});

// POST /api/decisions
// Enforces ENF-04: Phase Must Be Active for Creation
decisionsRouter.post('/', (req, res, next) => {
  try {
    const { phase_id, content } = req.body;

    if (!phase_id || typeof phase_id !== 'string') {
      return res.status(400).json({ error: 'phase_id is required' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and cannot be empty' });
    }

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const decisionRepo = new DecisionRepository(db);
    const decisionService = new DecisionService(decisionRepo);
    const phaseRepo = new PhaseRepository(db);

    // ENF-04: Ensure phase exists and is active
    const phase = phaseRepo.findById(phase_id);
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    enforcer.enforcePhaseIsActiveForCreation(phase);

    // Create decision
    const decision = decisionService.createDecision({ phase_id, content });

    // Log to audit trail
    enforcer.logEntityCreation('Decision', decision.id, {
      phase_id,
      status: decision.status,
    });

    res.status(201).json(decision);
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});

// PATCH /api/decisions/:id
// Enforces ENF-02: Decision Immutability After Lock
decisionsRouter.patch('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and cannot be empty' });
    }

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const decisionRepo = new DecisionRepository(db);
    const decisionService = new DecisionService(decisionRepo);

    // Get existing decision
    const existingDecision = decisionService.getDecision(id);
    if (!existingDecision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // ENF-02: Ensure decision is DRAFT (not locked)
    enforcer.enforceDecisionIsDraft(existingDecision);

    // Update decision
    const updated = decisionService.updateDecision(id, content);

    // Log to audit trail
    enforcer.logEntityUpdate('Decision', id, {
      old_content_hash: existingDecision.content_hash,
      new_content_hash: updated.content_hash,
    });

    res.json(updated);
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});

// POST /api/decisions/:id/lock
// Validates DRAFT → LOCKED state transition
decisionsRouter.post('/:id/lock', (req, res, next) => {
  try {
    const { id } = req.params;

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const decisionRepo = new DecisionRepository(db);
    const decisionService = new DecisionService(decisionRepo);

    // Get existing decision
    const decision = decisionService.getDecision(id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // Validate state transition
    validateDecisionTransition(decision.status, 'LOCKED');

    // Lock decision (DRAFT → LOCKED)
    const locked = decisionService.lockDecision(id);

    // Log to audit trail
    enforcer.logEntityUpdate('Decision', id, {
      old_status: decision.status,
      new_status: locked.status,
      action: 'LOCKED',
    });

    res.json(locked);
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

// DELETE /api/decisions/:id
// Enforces ENF-02: Decision Immutability After Lock
decisionsRouter.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const decisionRepo = new DecisionRepository(db);
    const decisionService = new DecisionService(decisionRepo);

    // Get existing decision
    const decision = decisionService.getDecision(id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // ENF-02: Ensure decision is DRAFT (not locked)
    enforcer.enforceDecisionIsDraft(decision);

    // Delete decision
    decisionService.deleteDecision(id);

    // Log to audit trail
    enforcer.logEntityDeletion('Decision', id, {
      status: decision.status,
      phase_id: decision.phase_id,
    });

    res.status(204).send();
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});
