// ============================================
// Notes: Create
// POST /.netlify/functions/notes-create
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import { CONFIG } from '../../../shared/config';
import type { CreateNoteRequest, Note } from '../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'POST') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: CreateNoteRequest = JSON.parse(event.body || '{}');
  const { content, source_id } = body;

  if (!content || content.trim().length === 0) {
    throw new APIError(400, 'Note content required');
  }

  if (content.length > CONFIG.NOTE_MAX_LENGTH) {
    throw new APIError(400, `Note cannot exceed ${CONFIG.NOTE_MAX_LENGTH} characters`);
  }

  const noteId = crypto.randomUUID();

  // Get document ID
  const docResult = await db.execute({
    sql: 'SELECT id FROM document WHERE user_id = ? LIMIT 1',
    args: [user.user_id],
  });

  const documentId = (docResult.rows[0] as { id: string }).id;

  await db.execute({
    sql: `INSERT INTO note (id, user_id, document_id, content, source_id)
          VALUES (?, ?, ?, ?, ?)`,
    args: [noteId, user.user_id, documentId, content.trim(), source_id || null],
  });

  // Fetch created note
  const result = await db.execute({
    sql: 'SELECT * FROM note WHERE id = ?',
    args: [noteId],
  });

  const note = result.rows[0] as unknown as Note;

  return withCors({
    statusCode: 201,
    body: JSON.stringify(note),
  });
});
