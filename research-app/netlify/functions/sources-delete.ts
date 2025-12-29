// ============================================
// Sources: Delete
// DELETE /.netlify/functions/sources-delete?id=<source_id>
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

  const sourceId = event.queryStringParameters?.id;

  if (!sourceId) {
    throw new APIError(400, 'Source ID required');
  }

  // Delete will cascade to annotations
  await db.execute({
    sql: 'DELETE FROM source WHERE id = ? AND user_id = ?',
    args: [sourceId, user.user_id],
  });

  return withCors({
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  });
});
