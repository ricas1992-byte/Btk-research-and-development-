import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All document routes require auth
router.use(authMiddleware);

/**
 * GET /document
 * Get the user's single document
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const document = db.prepare(`
      SELECT id, user_id, title, content, created_at, updated_at, writing_phase
      FROM document
      WHERE user_id = ?
    `).get(req.userId!) as any;

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        writingPhase: document.writing_phase,
        createdAt: document.created_at,
        updatedAt: document.updated_at
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document'
    });
  }
});

/**
 * PUT /document
 * Update document title and/or content
 */
router.put('/', (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        error: 'Title or content is required'
      });
    }

    const db = getDb();

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.userId!);

    db.prepare(`
      UPDATE document
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `).run(...params);

    // Fetch updated document
    const document = db.prepare(`
      SELECT id, user_id, title, content, created_at, updated_at, writing_phase
      FROM document
      WHERE user_id = ?
    `).get(req.userId!) as any;

    res.json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        writingPhase: document.writing_phase,
        createdAt: document.created_at,
        updatedAt: document.updated_at
      }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
});

export default router;
