import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Enforcer } from '../../domain/services/Enforcer.js';
import { DocumentService } from '../../domain/services/DocumentService.js';
import { DocumentRepository } from '../../domain/repositories/DocumentRepository.js';
import { PhaseRepository } from '../../domain/repositories/PhaseRepository.js';

export const documentsRouter = Router();

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

// GET /api/documents?phase_id=x
documentsRouter.get('/', (req, res, next) => {
  try {
    const phase_id = req.query.phase_id as string | undefined;
    const db = getDatabase();
    const documentRepo = new DocumentRepository(db);
    const documentService = new DocumentService(documentRepo);

    const documents = phase_id
      ? documentService.getDocumentsByPhase(phase_id)
      : [];

    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// POST /api/documents
// Enforces ENF-04: Phase Must Be Active for Creation
documentsRouter.post('/', (req, res, next) => {
  try {
    const { phase_id, title, content = '' } = req.body;

    if (!phase_id || typeof phase_id !== 'string') {
      return res.status(400).json({ error: 'phase_id is required' });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and cannot be empty' });
    }

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const documentRepo = new DocumentRepository(db);
    const documentService = new DocumentService(documentRepo);
    const phaseRepo = new PhaseRepository(db);

    // ENF-04: Ensure phase exists and is active
    const phase = phaseRepo.findById(phase_id);
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    enforcer.enforcePhaseIsActiveForCreation(phase);

    // Create document
    const document = documentService.createDocument({ phase_id, title, content });

    // Log to audit trail
    enforcer.logEntityCreation('Document', document.id, {
      phase_id,
      title,
    });

    res.status(201).json(document);
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});

// PATCH /api/documents/:id
// Enforces ENF-05: Phase Must Be Active for Updates
documentsRouter.patch('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const updates: { title?: string; content?: string } = {};

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || req.body.title.trim().length === 0) {
        return res.status(400).json({ error: 'title cannot be empty' });
      }
      updates.title = req.body.title;
    }
    if (req.body.content !== undefined) {
      updates.content = req.body.content;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const documentRepo = new DocumentRepository(db);
    const documentService = new DocumentService(documentRepo);
    const phaseRepo = new PhaseRepository(db);

    // Get existing document
    const existingDoc = documentService.getDocument(id);
    if (!existingDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // ENF-05: Ensure phase is active
    const phase = phaseRepo.findById(existingDoc.phase_id);
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    enforcer.enforcePhaseIsActiveForUpdate(phase);

    // Update document
    const updated = documentService.updateDocument(id, updates);

    // Log to audit trail
    enforcer.logEntityUpdate('Document', id, {
      old_content_hash: existingDoc.content_hash,
      new_content_hash: updated.content_hash,
      updated_fields: Object.keys(updates),
    });

    res.json(updated);
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});

// DELETE /api/documents/:id
// Enforces ENF-05: Phase Must Be Active for Updates
documentsRouter.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const enforcer = new Enforcer(db);
    const documentRepo = new DocumentRepository(db);
    const documentService = new DocumentService(documentRepo);
    const phaseRepo = new PhaseRepository(db);

    // Get existing document
    const document = documentService.getDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // ENF-05: Ensure phase is active
    const phase = phaseRepo.findById(document.phase_id);
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    enforcer.enforcePhaseIsActiveForUpdate(phase);

    // Delete document
    documentService.deleteDocument(id);

    // Log to audit trail
    enforcer.logEntityDeletion('Document', id, {
      phase_id: document.phase_id,
      title: document.title,
    });

    res.status(204).send();
  } catch (error: any) {
    if (handleEnforcementError(error, res)) return;
    next(error);
  }
});
