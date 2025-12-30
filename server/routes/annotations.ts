import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All annotation routes require auth
router.use(authMiddleware);

/**
 * GET /sources/:sourceId/annotations
 * Get all annotations for a source
 */
router.get('/sources/:sourceId/annotations', (req, res) => {
  try {
    const db = getDb();

    const annotations = db.prepare(`
      SELECT id, source_id, text_selection, start_offset, end_offset,
             note_content, highlight_color, created_at, synced_to_notes
      FROM annotation
      WHERE source_id = ? AND user_id = ?
      ORDER BY start_offset ASC
    `).all(req.params.sourceId, req.userId!) as any[];

    res.json({
      success: true,
      data: annotations.map(a => ({
        id: a.id,
        sourceId: a.source_id,
        textSelection: a.text_selection,
        startOffset: a.start_offset,
        endOffset: a.end_offset,
        noteContent: a.note_content,
        highlightColor: a.highlight_color,
        createdAt: a.created_at,
        syncedToNotes: Boolean(a.synced_to_notes)
      }))
    });
  } catch (error) {
    console.error('Get annotations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get annotations'
    });
  }
});

/**
 * POST /sources/:sourceId/annotations
 * Create a new annotation
 */
router.post('/sources/:sourceId/annotations', (req, res) => {
  try {
    const { textSelection, startOffset, endOffset, noteContent, highlightColor } = req.body;

    if (!textSelection || startOffset === undefined || endOffset === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Text selection and offsets are required'
      });
    }

    const db = getDb();

    // Verify source exists and belongs to user
    const source = db.prepare(`
      SELECT id FROM source WHERE id = ? AND user_id = ?
    `).get(req.params.sourceId, req.userId!);

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO annotation (id, source_id, user_id, text_selection,
                             start_offset, end_offset, note_content,
                             highlight_color, created_at, synced_to_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `).run(
      id,
      req.params.sourceId,
      req.userId!,
      textSelection,
      startOffset,
      endOffset,
      noteContent || null,
      highlightColor || null
    );

    const annotation = db.prepare(`
      SELECT id, source_id, text_selection, start_offset, end_offset,
             note_content, highlight_color, created_at, synced_to_notes
      FROM annotation
      WHERE id = ?
    `).get(id) as any;

    res.status(201).json({
      success: true,
      data: {
        id: annotation.id,
        sourceId: annotation.source_id,
        textSelection: annotation.text_selection,
        startOffset: annotation.start_offset,
        endOffset: annotation.end_offset,
        noteContent: annotation.note_content,
        highlightColor: annotation.highlight_color,
        createdAt: annotation.created_at,
        syncedToNotes: Boolean(annotation.synced_to_notes)
      }
    });
  } catch (error) {
    console.error('Create annotation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create annotation'
    });
  }
});

/**
 * DELETE /annotations/:id
 * Delete an annotation
 */
router.delete('/annotations/:id', (req, res) => {
  try {
    const db = getDb();

    const result = db.prepare(`
      DELETE FROM annotation
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.userId!);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found'
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Delete annotation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete annotation'
    });
  }
});

export default router;
