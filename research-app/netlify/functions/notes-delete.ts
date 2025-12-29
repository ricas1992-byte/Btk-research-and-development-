// ============================================
// Notes: Delete
// DELETE /.netlify/functions/notes-delete?id=<note_id>
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'DELETE') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const noteId = event.queryStringParameters?.id;

  if (!noteId) {
    throw new APIError(400, 'Note ID required');
  }

  // Delete note (annotation is preserved)
  await db.execute({
    sql: 'DELETE FROM note WHERE id = ? AND user_id = ?',
    args: [noteId, user.user_id],
  });

  return withCors({
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  });
});
