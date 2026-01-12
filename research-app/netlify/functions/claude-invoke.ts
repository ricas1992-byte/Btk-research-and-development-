// ============================================
// Claude: Invoke
// POST /.netlify/functions/claude-invoke
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { invokeClaudeAction } from './_shared/claude';
import { APIError } from './_shared/errors';
import type { InvokeClaudeRequest, InvokeClaudeResponse } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'POST') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: InvokeClaudeRequest = JSON.parse(event.body || '{}');
  const { action_type, input, context } = body;

  if (!action_type) {
    throw new APIError(400, 'Action type required');
  }

  // Get input snapshot based on action type
  let inputSnapshot = input || '';

  if (action_type === 'SUMMARIZE') {
    // Get all unlocked notes
    const notesResult = await db.execute({
      sql: 'SELECT content FROM note WHERE user_id = ? AND is_locked = 0 ORDER BY created_at ASC',
      args: [user.user_id],
    });

    inputSnapshot = notesResult.rows
      .map((row: any) => row.content)
      .join('\n\n');

    if (!inputSnapshot) {
      throw new APIError(400, 'No notes to summarize');
    }
  } else if (action_type === 'DRAFT') {
    // Get all unlocked notes
    const notesResult = await db.execute({
      sql: 'SELECT content FROM note WHERE user_id = ? AND is_locked = 0 ORDER BY created_at ASC',
      args: [user.user_id],
    });

    inputSnapshot = notesResult.rows
      .map((row: any) => row.content)
      .join('\n\n');

    if (!inputSnapshot) {
      throw new APIError(400, 'No notes for draft');
    }
  } else if (!inputSnapshot) {
    throw new APIError(400, 'Input required');
  }

  // Invoke Claude
  const { output, statusTag } = await invokeClaudeAction(
    action_type,
    inputSnapshot,
    context
  );

  // Get document ID
  const docResult = await db.execute({
    sql: 'SELECT id FROM document WHERE user_id = ? LIMIT 1',
    args: [user.user_id],
  });

  const documentId = (docResult.rows[0] as { id: string }).id;

  // Save output
  const outputId = crypto.randomUUID();

  await db.execute({
    sql: `INSERT INTO claude_output (id, user_id, document_id, action_type, input_snapshot, output_content, status_tag)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      outputId,
      user.user_id,
      documentId,
      action_type,
      inputSnapshot,
      output,
      statusTag,
    ],
  });

  const response: InvokeClaudeResponse = {
    output_id: outputId,
    output_content: output,
    status_tag: statusTag,
  };

  return withCors({
    statusCode: 200,
    body: JSON.stringify(response),
  });
});
