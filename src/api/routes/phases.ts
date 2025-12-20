import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { validateConfirmation } from '../../core/state-validator.js';
import { validatePhaseTransition } from '../../core/state-machines/phase.js';

export const phasesRouter = Router();

// GET /api/phases/active
phasesRouter.get('/active', (_req, res, next) => {
  try {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const phase = gateway.getActivePhase();
    if (!phase) {
      res.status(404).json({ error: { code: 'E1002', message: 'No active phase found' } });
      return;
    }
    res.json(phase);
  } catch (error) {
    next(error);
  }
});

// GET /api/phases/closed
phasesRouter.get('/closed', (_req, res, next) => {
  try {
    const db = getDatabase();
    const gateway = new Gateway(db);
    const phases = gateway.getPhases('CLOSED');
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
    const gateway = new Gateway(db);
    const phase = gateway.getPhase(id);
    res.json(phase);
  } catch (error) {
    next(error);
  }
});

// POST /api/phases/:id/close/token
phasesRouter.post('/:id/close/token', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);

    const phase = gateway.getPhase(id);
    validatePhaseTransition(phase.status, 'CLOSED');

    const token = uuidv4();
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// POST /api/phases/:id/close
phasesRouter.post('/:id/close', (req, res, next) => {
  try {
    const { id } = req.params;
    const { token, confirmation } = req.body;

    validateConfirmation(confirmation, 'CLOSE', 'close phase');

    const db = getDatabase();
    const gateway = new Gateway(db);
    // const checker = new InvariantChecker(db);

    // Verify token hasn't been used
    if (gateway.isTokenUsed(token)) {
      throw new Error('Token already used');
    }

    const phase = gateway.getPhase(id);
    validatePhaseTransition(phase.status, 'CLOSED');

    // Create snapshots of all documents in this phase
    const documents = gateway.getDocuments(id);
    for (const doc of documents) {
      gateway.createSnapshot(id, doc.id, doc.title, doc.content);
    }

    // Close the phase
    const updatedPhase = gateway.updatePhaseStatus(id, 'CLOSED');

    // Mark token as used
    gateway.markTokenAsUsed(token, 'close-phase');

    res.json(updatedPhase);
  } catch (error) {
    next(error);
  }
});

// GET /api/phases/:id/snapshots
phasesRouter.get('/:id/snapshots', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const snapshots = gateway.getSnapshots(id);
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});
