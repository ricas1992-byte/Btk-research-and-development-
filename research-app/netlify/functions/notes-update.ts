// ============================================
// Notes: Update
// PUT /.netlify/functions/notes-update?id=<note_id>
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import { APIError } from './_shared/errors';
import { CONFIG } from '../../../shared/config';
import type { UpdateNoteRequest, Note } from '../../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'PUT') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const noteId = event.queryStringParameters?.id;

  if (!noteId) {
    throw new APIError(400, 'Note ID required');
  }

  const body: UpdateNoteRequest = JSON.parse(event.body || '{}');
  const { content } = body;

  if (!content || content.trim().length === 0) {
    throw new APIError(400, 'Note content required');
  }

  if (content.length > CONFIG.NOTE_MAX_LENGTH) {
    throw new APIError(400, `Note cannot exceed ${CONFIG.NOTE_MAX_LENGTH} characters`);
  }

  // Check if note is locked
  const checkResult = await db.execute({
    sql: 'SELECT is_locked FROM note WHERE id = ? AND user_id = ?',
    args: [noteId, user.user_id],
  });

  if (checkResult.rows.length === 0) {
    throw new APIError(404, 'Note not found');
  }

  const isLocked = (checkResult.rows[0] as { is_locked: number }).is_locked;

  if (isLocked === 1) {
    throw new APIError(403, 'Cannot edit locked note');
  }

  // Update note
  await db.execute({
    sql: "UPDATE note SET content = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
    args: [content.trim(), noteId, user.user_id],
  });

  // Fetch updated note
  const result = await db.execute({
    sql: 'SELECT * FROM note WHERE id = ?',
    args: [noteId],
  });

  const note = result.rows[0] as unknown as Note;

  return withCors({
    statusCode: 200,
    body: JSON.stringify(note),
  });
});
