// ============================================
// Admin: Resolve Exception
// PUT /.netlify/functions/admin-resolve
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import type { ResolveExceptionRequest } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'PUT') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: ResolveExceptionRequest = JSON.parse(event.body || '{}');
  const { exception_id, action } = body;

  if (!exception_id || !action) {
    throw new APIError(400, 'Exception ID and action required');
  }

  if (action !== 'DISMISS') {
    throw new APIError(400, 'Unknown action (only DISMISS supported)');
  }

  // Check exception exists
  const checkResult = await db.execute({
    sql: 'SELECT id FROM admin_exception WHERE id = ? AND user_id = ?',
    args: [exception_id, user.user_id],
  });

  if (checkResult.rows.length === 0) {
    throw new APIError(404, 'Exception not found');
  }

  // Dismiss exception
  await db.execute({
    sql: "UPDATE admin_exception SET status = 'DISMISSED', resolved_at = datetime('now') WHERE id = ?",
    args: [exception_id],
  });

  return withCors({
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  });
});
