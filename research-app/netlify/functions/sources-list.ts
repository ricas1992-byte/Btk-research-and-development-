// ============================================
// Sources: List
// GET /.netlify/functions/sources-list
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { Source } from '../../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, user) => {
  const result = await db.execute({
    sql: 'SELECT * FROM source WHERE user_id = ? ORDER BY created_at ASC',
    args: [user.user_id],
  });

  const sources = result.rows as unknown as Source[];

  return withCors({
    statusCode: 200,
    body: JSON.stringify(sources),
  });
});
