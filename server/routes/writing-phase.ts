import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All writing phase routes require auth
router.use(authMiddleware);

/**
 * GET /writing-phase
 * Get current writing phase
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const document = db.prepare(`
      SELECT writing_phase FROM document WHERE user_id = ?
    `).get(req.userId!) as { writing_phase: string } | undefined;

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        phase: document.writing_phase
      }
    });
  } catch (error) {
    console.error('Get writing phase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get writing phase'
    });
  }
});

/**
 * POST /writing-phase/ready-to-write
 * Transition from NOTES to DRAFTING phase (one-way gate)
 */
router.post('/ready-to-write', (req, res) => {
  try {
    const db = getDb();

    // Get current phase
    const document = db.prepare(`
      SELECT id, writing_phase FROM document WHERE user_id = ?
    `).get(req.userId!) as { id: string; writing_phase: string } | undefined;

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if already in DRAFTING
    if (document.writing_phase === 'DRAFTING') {
      return res.status(400).json({
        success: false,
        error: 'Already in DRAFTING phase'
      });
    }

    // Check if user has any notes
    const noteCount = db.prepare(`
      SELECT COUNT(*) as count FROM note WHERE user_id = ?
    `).get(req.userId!) as { count: number };

    if (noteCount.count === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transition: no notes exist'
      });
    }

    // Begin transaction
    db.prepare('BEGIN').run();

    try {
      // Update phase
      db.prepare(`
        UPDATE document
        SET writing_phase = 'DRAFTING', updated_at = datetime('now')
        WHERE user_id = ?
      `).run(req.userId!);

      // Lock all notes
      db.prepare(`
        UPDATE note
        SET is_locked = 1
        WHERE user_id = ?
      `).run(req.userId!);

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        data: {
          phase: 'DRAFTING',
          notesLocked: true
        }
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Transition phase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transition phase'
    });
  }
});

export default router;
