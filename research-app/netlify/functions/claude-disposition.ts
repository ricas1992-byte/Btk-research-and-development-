// ============================================
// Claude: Update Disposition
// PUT /.netlify/functions/claude-disposition
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import type { UpdateDispositionRequest } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'PUT') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: UpdateDispositionRequest = JSON.parse(event.body || '{}');
  const { output_id, disposition } = body;

  if (!output_id || !disposition) {
    throw new APIError(400, 'Output ID and disposition required');
  }

  if (disposition !== 'COPIED' && disposition !== 'DISCARDED') {
    throw new APIError(400, 'Invalid disposition');
  }

  await db.execute({
    sql: 'UPDATE claude_output SET disposition = ? WHERE id = ? AND user_id = ?',
    args: [disposition, output_id, user.user_id],
  });

  return withCors({
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  });
});
