// ============================================
// Annotations: List
// GET /.netlify/functions/annotations-list?source_id=<source_id>
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import type { Annotation } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  const sourceId = event.queryStringParameters?.source_id;

  if (!sourceId) {
    throw new APIError(400, 'Source ID required');
  }

  const result = await db.execute({
    sql: 'SELECT * FROM annotation WHERE source_id = ? AND user_id = ? ORDER BY start_offset ASC',
    args: [sourceId, user.user_id],
  });

  const annotations = result.rows as unknown as Annotation[];

  return withCors({
    statusCode: 200,
    body: JSON.stringify(annotations),
  });
});
