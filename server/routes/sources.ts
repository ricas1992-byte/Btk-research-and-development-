import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All source routes require auth
router.use(authMiddleware);

/**
 * GET /sources
 * Get all sources for the user
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const sources = db.prepare(`
      SELECT id, title, source_type, source_url, created_at
      FROM source
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId!) as any[];

    res.json({
      success: true,
      data: sources.map(s => ({
        id: s.id,
        title: s.title,
        sourceType: s.source_type,
        sourceUrl: s.source_url,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sources'
    });
  }
});

/**
 * GET /sources/:id
 * Get a single source with full content
 */
router.get('/:id', (req, res) => {
  try {
    const db = getDb();

    const source = db.prepare(`
      SELECT id, title, content, source_type, source_url, created_at
      FROM source
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId!) as any;

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: source.id,
        title: source.title,
        content: source.content,
        sourceType: source.source_type,
        sourceUrl: source.source_url,
        createdAt: source.created_at
      }
    });
  } catch (error) {
    console.error('Get source error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get source'
    });
  }
});

export default router;
