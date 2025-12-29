// ============================================
// Error Handling
// ============================================

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleError(error: unknown): {
  statusCode: number;
  body: string;
} {
  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ error: error.message, code: error.code }),
    };
  }

  console.error('Unexpected error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'An unexpected error occurred.' }),
  };
}

// Standard error responses (per spec)
export const ERRORS = {
  INVALID_CREDENTIALS: new APIError(
    401,
    'Sign-in failed. Please check your details and try again.'
  ),
  UNAUTHORIZED: new APIError(401, 'Session expired. Please sign in again.'),
  RATE_LIMITED: new APIError(
    429,
    'Too many attempts. Please wait a few minutes and try again.'
  ),
  SERVICE_UNAVAILABLE: new APIError(
    503,
    'Service temporarily unavailable. Please try again.'
  ),
  CLAUDE_UNAVAILABLE: new APIError(
    503,
    'Claude is temporarily unavailable. Try again.'
  ),
  CLAUDE_TIMEOUT: new APIError(504, 'Claude is taking too long. Retry?'),
};
