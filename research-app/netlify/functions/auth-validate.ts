// ============================================
// Auth: Validate
// GET /.netlify/functions/auth-validate
// ============================================

import type { Handler } from '@netlify/functions';
import { withAuth, withCors } from './_shared/middleware';
import type { ValidateResponse } from '../../shared/types';

export const handler: Handler = withAuth(async (_event, _context, user) => {
  const response: ValidateResponse = {
    valid: true,
    user_id: user.user_id,
  };

  return withCors({
    statusCode: 200,
    body: JSON.stringify(response),
  });
});
