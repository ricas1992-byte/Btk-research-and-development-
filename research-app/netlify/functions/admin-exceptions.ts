// ============================================
// Admin: List Exceptions
// GET /.netlify/functions/admin-exceptions
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { AdminException } from '../../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, user) => {
  const result = await db.execute({
    sql: "SELECT * FROM admin_exception WHERE user_id = ? AND status = 'PENDING' ORDER BY detected_at DESC",
    args: [user.user_id],
  });

  const exceptions = result.rows as unknown as AdminException[];

  return withCors({
    statusCode: 200,
    body: JSON.stringify(exceptions),
  });
});
