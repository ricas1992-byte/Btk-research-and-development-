// ============================================
// Notes: List
// GET /.netlify/functions/notes-list
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { Note } from '../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, user) => {
  const result = await db.execute({
    sql: 'SELECT * FROM note WHERE user_id = ? ORDER BY created_at DESC',
    args: [user.user_id],
  });

  const notes = result.rows as unknown as Note[];

  return withCors({
    statusCode: 200,
    body: JSON.stringify(notes),
  });
});
