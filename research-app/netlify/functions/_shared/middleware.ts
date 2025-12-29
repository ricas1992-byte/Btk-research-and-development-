// ============================================
// Middleware
// ============================================

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { validateToken } from './auth';
import { handleError, ERRORS } from './errors';
import type { TokenPayload } from '../../../shared/types';

type AuthenticatedHandler = (
  event: HandlerEvent,
  context: HandlerContext,
  user: TokenPayload
) => Promise<{
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}>;

export function withAuth(handler: AuthenticatedHandler): Handler {
  return async (event, context) => {
    try {
      const authHeader = event.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw ERRORS.UNAUTHORIZED;
      }

      const token = authHeader.slice(7);
      const user = validateToken(token);

      if (!user) {
        throw ERRORS.UNAUTHORIZED;
      }

      return await handler(event, context, user);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withCors(response: {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}): {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
} {
  return {
    ...response,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...response.headers,
    },
  };
}
