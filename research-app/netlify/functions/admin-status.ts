// ============================================
// Admin: Get System Status
// GET /.netlify/functions/admin-status
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { SystemStatus } from '../../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, _user) => {
  const result = await db.execute({
    sql: 'SELECT * FROM system_status ORDER BY function_code ASC',
  });

  const status = result.rows as unknown as SystemStatus[];

  return withCors({
    statusCode: 200,
    body: JSON.stringify(status),
  });
});
