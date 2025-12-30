import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth
router.use(authMiddleware);

/**
 * GET /admin/exceptions
 * Get pending exceptions
 */
router.get('/exceptions', (req, res) => {
  try {
    const db = getDb();

    const exceptions = db.prepare(`
      SELECT id, exception_type, severity, description, impact,
             detected_at, status, resolution_action, resolved_at
      FROM admin_exception
      WHERE user_id = ? AND status = 'PENDING'
      ORDER BY detected_at DESC
    `).all(req.userId!) as any[];

    res.json({
      success: true,
      data: exceptions.map(e => ({
        id: e.id,
        exceptionType: e.exception_type,
        severity: e.severity,
        description: e.description,
        impact: e.impact,
        detectedAt: e.detected_at,
        status: e.status,
        resolutionAction: e.resolution_action,
        resolvedAt: e.resolved_at
      }))
    });
  } catch (error) {
    console.error('Get exceptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get exceptions'
    });
  }
});

/**
 * POST /admin/exceptions/:id/dismiss
 * Dismiss an exception
 */
router.post('/exceptions/:id/dismiss', (req, res) => {
  try {
    const db = getDb();

    const result = db.prepare(`
      UPDATE admin_exception
      SET status = 'DISMISSED', resolved_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.userId!);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exception not found'
      });
    }

    const updated = db.prepare(`
      SELECT id, exception_type, severity, description, impact,
             detected_at, status, resolution_action, resolved_at
      FROM admin_exception
      WHERE id = ?
    `).get(req.params.id) as any;

    res.json({
      success: true,
      data: {
        id: updated.id,
        exceptionType: updated.exception_type,
        severity: updated.severity,
        description: updated.description,
        impact: updated.impact,
        detectedAt: updated.detected_at,
        status: updated.status,
        resolutionAction: updated.resolution_action,
        resolvedAt: updated.resolved_at
      }
    });
  } catch (error) {
    console.error('Dismiss exception error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss exception'
    });
  }
});

/**
 * GET /admin/status
 * Get system status for all function codes
 */
router.get('/status', (req, res) => {
  try {
    const db = getDb();

    const statuses = db.prepare(`
      SELECT id, function_code, status, last_check_at, message
      FROM system_status
      ORDER BY function_code ASC
    `).all() as any[];

    res.json({
      success: true,
      data: statuses.map(s => ({
        functionCode: s.function_code,
        status: s.status,
        lastCheckAt: s.last_check_at,
        message: s.message
      }))
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

export default router;
