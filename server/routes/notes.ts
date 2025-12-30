import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All note routes require auth
router.use(authMiddleware);

/**
 * Validate note format
 */
function validateNoteFormat(content: string): { valid: boolean; error?: string } {
  // Max 300 characters
  if (content.length > 300) {
    return { valid: false, error: 'Note exceeds 300 character limit' };
  }

  // Must not be empty
  if (!content.trim()) {
    return { valid: false, error: 'Note cannot be empty' };
  }

  // Point-based format check:
  // - No double line breaks (paragraphs)
  // - Quotes: max 2 sentences (count periods)
  // - Thoughts: max 1 sentence if not a quote

  if (content.includes('\n\n')) {
    return { valid: false, error: 'Note format invalid: no paragraphs allowed (point-based format only)' };
  }

  // Count sentences (periods followed by space or end of string)
  const sentenceCount = (content.match(/\.\s+|\.$/g) || []).length;

  // If it starts with a quote mark, allow up to 2 sentences
  const isQuote = content.trim().startsWith('"') || content.trim().startsWith("'");

  if (isQuote && sentenceCount > 2) {
    return { valid: false, error: 'Note format invalid: quotes must be max 2 sentences' };
  }

  if (!isQuote && sentenceCount > 1) {
    return { valid: false, error: 'Note format invalid: thoughts must be max 1 sentence' };
  }

  return { valid: true };
}

/**
 * GET /notes
 * Get all notes for the user
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const notes = db.prepare(`
      SELECT id, content, source_id, annotation_id, created_at, updated_at, is_locked
      FROM note
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId!) as any[];

    res.json({
      success: true,
      data: notes.map(n => ({
        id: n.id,
        content: n.content,
        sourceId: n.source_id,
        annotationId: n.annotation_id,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
        isLocked: Boolean(n.is_locked)
      }))
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notes'
    });
  }
});

/**
 * POST /notes
 * Create a new note
 */
router.post('/', (req, res) => {
  try {
    const { content, sourceId, annotationId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // Validate format
    const validation = validateNoteFormat(content);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const db = getDb();

    // Get user's document
    const document = db.prepare(`
      SELECT id FROM document WHERE user_id = ?
    `).get(req.userId!) as { id: string } | undefined;

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO note (id, user_id, document_id, content, source_id,
                        annotation_id, created_at, updated_at, is_locked)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)
    `).run(
      id,
      req.userId!,
      document.id,
      content,
      sourceId || null,
      annotationId || null
    );

    const note = db.prepare(`
      SELECT id, content, source_id, annotation_id, created_at, updated_at, is_locked
      FROM note
      WHERE id = ?
    `).get(id) as any;

    res.status(201).json({
      success: true,
      data: {
        id: note.id,
        content: note.content,
        sourceId: note.source_id,
        annotationId: note.annotation_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isLocked: Boolean(note.is_locked)
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
});

/**
 * PUT /notes/:id
 * Update a note
 */
router.put('/:id', (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // Validate format
    const validation = validateNoteFormat(content);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const db = getDb();

    // Check if note is locked
    const note = db.prepare(`
      SELECT is_locked FROM note WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId!) as { is_locked: number } | undefined;

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    if (note.is_locked) {
      return res.status(403).json({
        success: false,
        error: 'Cannot edit locked note'
      });
    }

    db.prepare(`
      UPDATE note
      SET content = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(content, req.params.id, req.userId!);

    const updated = db.prepare(`
      SELECT id, content, source_id, annotation_id, created_at, updated_at, is_locked
      FROM note
      WHERE id = ?
    `).get(req.params.id) as any;

    res.json({
      success: true,
      data: {
        id: updated.id,
        content: updated.content,
        sourceId: updated.source_id,
        annotationId: updated.annotation_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        isLocked: Boolean(updated.is_locked)
      }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
});

/**
 * DELETE /notes/:id
 * Delete a note
 */
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();

    // Check if note is locked
    const note = db.prepare(`
      SELECT is_locked FROM note WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId!) as { is_locked: number } | undefined;

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    if (note.is_locked) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete locked note'
      });
    }

    db.prepare(`
      DELETE FROM note
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.userId!);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

export default router;
