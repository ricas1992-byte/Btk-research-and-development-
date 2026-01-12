// ============================================
// Document: Transition Phase
// PUT /.netlify/functions/document-phase
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import type { TransitionPhaseRequest, Document } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'PUT') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: TransitionPhaseRequest = JSON.parse(event.body || '{}');

  if (body.to_phase !== 'DRAFTING') {
    throw new APIError(400, 'Can only transition to DRAFTING phase');
  }

  // Transition to DRAFTING and lock all notes
  await db.batch([
    {
      sql: "UPDATE document SET writing_phase = 'DRAFTING', updated_at = datetime('now') WHERE user_id = ?",
      args: [user.user_id],
    },
    {
      sql: 'UPDATE note SET is_locked = 1 WHERE user_id = ?',
      args: [user.user_id],
    },
  ]);

  // Fetch updated document
  const result = await db.execute({
    sql: 'SELECT * FROM document WHERE user_id = ? LIMIT 1',
    args: [user.user_id],
  });

  const document = result.rows[0] as unknown as Document;

  return withCors({
    statusCode: 200,
    body: JSON.stringify(document),
  });
});
