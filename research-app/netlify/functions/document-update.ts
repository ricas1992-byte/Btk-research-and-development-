// ============================================
// Document: Update
// PUT /.netlify/functions/document-update
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { UpdateDocumentRequest, Document } from '../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'PUT') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: UpdateDocumentRequest = JSON.parse(event.body || '{}');
  const { title, content } = body;

  // Build dynamic update query
  const updates: string[] = [];
  const args: (string | undefined)[] = [];

  if (title !== undefined) {
    updates.push('title = ?');
    args.push(title);
  }

  if (content !== undefined) {
    updates.push('content = ?');
    args.push(content);
  }

  if (updates.length === 0) {
    return withCors({
      statusCode: 400,
      body: JSON.stringify({ error: 'No fields to update' }),
    });
  }

  updates.push("updated_at = datetime('now')");
  args.push(user.user_id);

  const sql = `UPDATE document SET ${updates.join(', ')} WHERE user_id = ?`;

  await db.execute({ sql, args });

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
