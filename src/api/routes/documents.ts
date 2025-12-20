import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { InvariantChecker } from '../../core/invariant-checker.js';
import { validateTitle, validateContent } from '../../core/state-validator.js';

export const documentsRouter = Router();

// GET /api/documents?phaseId=x
documentsRouter.get('/', (req, res, next) => {
  try {
    const phaseId = req.query.phaseId as string | undefined;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const documents = gateway.getDocuments(phaseId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// POST /api/documents
documentsRouter.post('/', (req, res, next) => {
  try {
    const { phaseId, title, content = '' } = req.body;
    validateTitle(title);
    validateContent(content);

    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    // Ensure phase is active
    checker.ensurePhaseIsActive(phaseId);

    const document = gateway.createDocument(phaseId, title, content);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/documents/:id
documentsRouter.patch('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const updates: { title?: string; content?: string } = {};

    if (req.body.title !== undefined) {
      validateTitle(req.body.title);
      updates.title = req.body.title;
    }
    if (req.body.content !== undefined) {
      validateContent(req.body.content);
      updates.content = req.body.content;
    }

    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const doc = gateway.getDocument(id);
    checker.ensurePhaseIsActive(doc.phaseId);

    const document = gateway.updateDocument(id, updates);
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id
documentsRouter.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const gateway = new Gateway(db);
    const checker = new InvariantChecker(db);

    const doc = gateway.getDocument(id);
    checker.ensurePhaseIsActive(doc.phaseId);

    gateway.deleteDocument(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
