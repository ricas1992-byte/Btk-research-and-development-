import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /auth/login
 * Login with email and password, returns session cookie
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const db = getDb();

    // Find user
    const user = db.prepare(`
      SELECT id, email, password_hash
      FROM user
      WHERE email = ?
    `).get(email) as { id: string; email: string; password_hash: string } | undefined;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Sign-in failed. Please check your details and try again.'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Sign-in failed. Please check your details and try again.'
      });
    }

    // Update last login
    db.prepare(`
      UPDATE user
      SET last_login_at = datetime('now')
      WHERE id = ?
    `).run(user.id);

    // Create session
    const sessionToken = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    db.prepare(`
      INSERT INTO session (id, user_id, token, created_at, expires_at)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(sessionId, user.id, sessionToken, expiresAt.toISOString());

    // Set HTTP-only cookie
    res.cookie('btk_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout and clear session
 */
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = req.cookies?.btk_session;

    if (token) {
      const db = getDb();

      // Delete session
      db.prepare('DELETE FROM session WHERE token = ?').run(token);
    }

    // Clear cookie
    res.clearCookie('btk_session');

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    // ==========================================
    // EMERGENCY BYPASS — Delete after Stage 2
    // ==========================================
    if (process.env.AUTH_BYPASS === 'true') {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'bypass',
            email: 'researcher@bypass.local'
          }
        }
      });
    }
    // ==========================================

    const db = getDb();

    const user = db.prepare(`
      SELECT id, email
      FROM user
      WHERE id = ?
    `).get(req.userId!) as { id: string; email: string } | undefined;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

export default router;
