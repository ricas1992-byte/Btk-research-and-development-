// ============================================
// Document: Get
// GET /.netlify/functions/document-get
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { Document } from '../../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, user) => {
  const result = await db.execute({
    sql: 'SELECT * FROM document WHERE user_id = ? LIMIT 1',
    args: [user.user_id],
  });

  if (result.rows.length === 0) {
    return withCors({
      statusCode: 404,
      body: JSON.stringify({ error: 'Document not found' }),
    });
  }

  const document = result.rows[0] as unknown as Document;

  return withCors({
    statusCode: 200,
    body: JSON.stringify(document),
  });
});
