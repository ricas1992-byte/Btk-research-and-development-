// ============================================
// Auth: Logout
// POST /.netlify/functions/auth-logout
// ============================================

import type { Handler } from '@netlify/functions';
import { withCors } from './_shared/middleware';

// Logout is client-side only - server just acknowledges
export const handler: Handler = async (event) => {
  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return withCors({ statusCode: 200, body: '' });
    }

    if (event.httpMethod !== 'POST') {
      return withCors({ statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) });
    }

    return withCors({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
  } catch (error) {
    return withCors({
      statusCode: 500,
      body: JSON.stringify({ error: 'An unexpected error occurred.' }),
    });
  }
};
