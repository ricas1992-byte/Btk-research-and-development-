import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/index.js';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Auth middleware - validates session token from HTTP-only cookie
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.btk_session;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  try {
    const db = getDb();

    // Find valid session
    const session = db.prepare(`
      SELECT user_id, expires_at
      FROM session
      WHERE token = ?
    `).get(token) as { user_id: string; expires_at: string } | undefined;

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Check if session expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired session
      db.prepare('DELETE FROM session WHERE token = ?').run(token);

      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Attach userId to request
    req.userId = session.user_id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}
