import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { InvariantChecker } from '../../core/invariant-checker.js';
import {
  validateTitle,
  validateContent,
  validateConfirmation,
} from '../../core/state-validator.js';
import { validateDecisionTransition } from '../../core/state-machines/decision.js';

export const decisionsRouter = Router();

// GET /api/decisions?phaseId=x
decisionsRouter.get('/', (req, res, next) => {
  try {
    const phaseId = req.query.phaseId as string | undefined;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const decisions = gateway.getDecisions(phaseId);
    res.json(decisions);
  } catch (error) {
    next(error);
  }
});

// POST /api/decisions
decisionsRouter.post('/', (req, res, next) => {
  try {
    const { phaseId, title, statement = '', rationale = '' } = req.body;
    validateTitle(title);
    validateContent(statement, 'statement');
    validateContent(rationale, 'rationale');

    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // Ensure phase is active
    checker.ensurePhaseIsActive(phaseId);

    const decision = gateway.createDecision(phaseId, title, statement, rationale);
    res.status(201).json(decision);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/decisions/:id
decisionsRouter.patch('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const updates: { title?: string; statement?: string; rationale?: string } = {};

    if (req.body.title !== undefined) {
      validateTitle(req.body.title);
      updates.title = req.body.title;
    }
    if (req.body.statement !== undefined) {
      validateContent(req.body.statement, 'statement');
      updates.statement = req.body.statement;
    }
    if (req.body.rationale !== undefined) {
      validateContent(req.body.rationale, 'rationale');
      updates.rationale = req.body.rationale;
    }

    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // MA-02: Ensure decision is DRAFT
    checker.ensureDecisionIsDraft(id);

    const decision = gateway.updateDecision(id, updates);
    res.json(decision);
  } catch (error) {
    next(error);
  }
});

// POST /api/decisions/:id/lock
decisionsRouter.post('/:id/lock', (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body;

    validateConfirmation(confirmation, 'LOCK', 'lock decision');

    const db = getDatabase();
    const gateway = new Gateway(db);

    const decision = gateway.getDecision(id);
    validateDecisionTransition(decision.status, 'LOCKED');

    const lockedDecision = gateway.lockDecision(id);
    res.json(lockedDecision);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/decisions/:id
decisionsRouter.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // MA-02: Ensure decision is DRAFT
    checker.ensureDecisionIsDraft(id);

    gateway.deleteDecision(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
