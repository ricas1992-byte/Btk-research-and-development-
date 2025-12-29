// ============================================
// Annotations: Create
// POST /.netlify/functions/annotations-create
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import { db } from './_shared/db';
import type { CreateAnnotationRequest, Annotation } from '../../shared/types';

export const handler: Handler = withAuth(async (event, _context, user) => {
  if (event.httpMethod !== 'POST') {
    return withCors({
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  }

  const body: CreateAnnotationRequest = JSON.parse(event.body || '{}');
  const {
    source_id,
    text_selection,
    start_offset,
    end_offset,
    note_content,
    highlight_color,
  } = body;

  const annotationId = crypto.randomUUID();

  // Create annotation
  await db.execute({
    sql: `INSERT INTO annotation (id, source_id, user_id, text_selection, start_offset, end_offset, note_content, highlight_color)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      annotationId,
      source_id,
      user.user_id,
      text_selection,
      start_offset,
      end_offset,
      note_content || null,
      highlight_color || '#FFD700',
    ],
  });

  // If note_content provided, create a note and link it
  if (note_content) {
    const noteId = crypto.randomUUID();

    // Get document ID
    const docResult = await db.execute({
      sql: 'SELECT id FROM document WHERE user_id = ? LIMIT 1',
      args: [user.user_id],
    });

    const documentId = (docResult.rows[0] as { id: string }).id;

    await db.execute({
      sql: `INSERT INTO note (id, user_id, document_id, content, source_id, annotation_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [noteId, user.user_id, documentId, note_content, source_id, annotationId],
    });

    // Mark annotation as synced to notes
    await db.execute({
      sql: 'UPDATE annotation SET synced_to_notes = 1 WHERE id = ?',
      args: [annotationId],
    });
  }

  // Fetch created annotation
  const result = await db.execute({
    sql: 'SELECT * FROM annotation WHERE id = ?',
    args: [annotationId],
  });

  const annotation = result.rows[0] as unknown as Annotation;

  return withCors({
    statusCode: 201,
    body: JSON.stringify(annotation),
  });
});
