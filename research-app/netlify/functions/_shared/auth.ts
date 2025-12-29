// ============================================
// Authentication Utilities
// ============================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { TokenPayload } from '../../../shared/types';
import type { User } from '../../../shared/types';
import { CONFIG } from '../../../shared/config';

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    user_id: user.id,
    email: user.email,
    issued_at: Date.now(),
    expires_at: Date.now() + CONFIG.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    session_id: crypto.randomUUID(),
  };

  return jwt.sign(payload, process.env.SESSION_SECRET!);
}

export function validateToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(
      token,
      process.env.SESSION_SECRET!
    ) as TokenPayload;

    if (payload.expires_at < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
