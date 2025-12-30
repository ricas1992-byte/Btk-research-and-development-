// ============================================
// Auth: Login
// POST /.netlify/functions/auth-login
// ============================================

import type { Handler } from '@netlify/functions';
import { db } from './_shared/db';
import { generateToken, comparePassword } from './_shared/auth';
import { handleError, ERRORS } from './_shared/errors';
import { withCors } from './_shared/middleware';
import type { LoginRequest, LoginResponse, User } from '../../shared/types';

export const handler: Handler = async (event) => {
  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return withCors({ statusCode: 200, body: '' });
    }

    if (event.httpMethod !== 'POST') {
      return withCors({ statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) });
    }

    const body: LoginRequest = JSON.parse(event.body || '{}');
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      throw ERRORS.INVALID_CREDENTIALS;
    }

    // Only accept the authorized username
    if (username !== 'yotam_ricas') {
      throw ERRORS.INVALID_CREDENTIALS;
    }

    // Find user
    const result = await db.execute({
      sql: 'SELECT * FROM user WHERE username = ?',
      args: [username],
    });

    if (result.rows.length === 0) {
      throw ERRORS.INVALID_CREDENTIALS;
    }

    const user = result.rows[0] as unknown as User;

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw ERRORS.INVALID_CREDENTIALS;
    }

    // Update last login
    await db.execute({
      sql: "UPDATE user SET last_login_at = datetime('now') WHERE id = ?",
      args: [user.id],
    });

    // Generate token
    const token = generateToken(user);
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const response: LoginResponse = {
      token,
      expires_at: expiresAt,
    };

    return withCors({
      statusCode: 200,
      body: JSON.stringify(response),
    });
  } catch (error) {
    return withCors(handleError(error));
  }
};
