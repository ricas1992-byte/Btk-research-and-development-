// ============================================
// Auth: Get Current User (Me)
// GET /.netlify/functions/auth-me
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import type { MeResponse } from '../../shared/types';

export const handler: Handler = async (event) => {
  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return withCors({ statusCode: 200, body: '' });
    }

    if (event.httpMethod !== 'GET') {
      return withCors({ statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) });
    }

    // Use withAuth middleware directly
    return await withAuth(async (_event, _context, user) => {
      const response: MeResponse = {
        user: {
          id: user.user_id,
          username: user.username,
        },
      };

      return withCors({
        statusCode: 200,
        body: JSON.stringify({ success: true, data: response }),
      });
    })(event, {} as any);

  } catch (error) {
    return withCors({
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' }),
    });
  }
};
