import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /admin/setup-user
 * Bootstrap endpoint for setting up the researcher user
 * Does NOT require auth - protected by bootstrap token
 */
router.post('/setup-user', async (req, res) => {
  // 1. BOOTSTRAP_ENABLED
  if (process.env.BOOTSTRAP_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Disabled' });
  }

  // 2. BOOTSTRAP_TOKEN configured
  const expected = process.env.BOOTSTRAP_TOKEN;
  if (typeof expected !== 'string' || expected.length < 32) {
    return res.status(403).json({ error: 'Misconfigured' });
  }

  // 3. Header check
  const headerVal = req.headers['x-bootstrap-token'];
  const provided = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  if (typeof provided !== 'string' || provided === '') {
    return res.status(403).json({ error: 'Token required' });
  }
  if (provided !== expected) {
    return res.status(403).json({ error: 'Token invalid' });
  }

  // 4. Body
  const body = req.body;
  if (body === null || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { username, password, confirmPassword } = body;

  // 5. Validate username
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'Username required' });
  }
  const u = username.trim();
  if (u.length < 3) {
    return res.status(400).json({ error: 'Username min 3 chars' });
  }
  if (u.length > 50) {
    return res.status(400).json({ error: 'Username max 50 chars' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(u)) {
    return res.status(400).json({ error: 'Username invalid chars' });
  }

  // 6. Validate password
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password min 8 chars' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password max 128 chars' });
  }

  // 7. Validate confirm
  if (typeof confirmPassword !== 'string') {
    return res.status(400).json({ error: 'Confirm required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords mismatch' });
  }

  // 8. Hash
  let hash: string;
  try {
    hash = await bcrypt.hash(password, 12);
  } catch {
    return res.status(500).json({ error: 'Hash failed' });
  }

  // 9. Store
  try {
    const db = getDb();

    // Check if researcher user exists
    const existing = db.prepare('SELECT id FROM user WHERE id = ?').get('researcher') as { id: string } | undefined;

    if (existing) {
      // Update existing user
      db.prepare(`
        UPDATE user
        SET email = ?, password_hash = ?
        WHERE id = ?
      `).run(`${u}@beyondthekeys.ai`, hash, 'researcher');
    } else {
      // Create new user
      db.prepare(`
        INSERT INTO user (id, email, password_hash, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run('researcher', `${u}@beyondthekeys.ai`, hash);

      // Create default document for the user
      db.prepare(`
        INSERT INTO document (id, user_id, title, content, created_at, updated_at, writing_phase)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `).run('doc-researcher', 'researcher', 'Research Document', '', 'NOTES');
    }

    console.log('[BOOTSTRAP] User stored successfully');
  } catch (error) {
    console.error('[BOOTSTRAP] Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.json({ message: 'Saved' });
});

// All other admin routes require auth
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
