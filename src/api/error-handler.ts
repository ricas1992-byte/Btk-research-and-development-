import { Request, Response, NextFunction } from 'express';
import { CDWError } from '../types/errors.js';

/**
 * Centralized error handler for Express.
 * Converts CDW errors to appropriate HTTP responses.
 */

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof CDWError) {
    const statusCode = getStatusCodeForError(err.code);
    res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Unknown error
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: {
      code: 'E9999',
      message: 'Internal server error',
    },
  });
}

function getStatusCodeForError(code: string): number {
  // E1xxx: Validation errors
  if (code.startsWith('E1')) return 400;

  // E2xxx: Not found
  if (code === 'E1002') return 404;

  // E3xxx: State transition errors
  if (code.startsWith('E3')) return 409;

  // E4xxx: Immutability errors
  if (code.startsWith('E4')) return 409;

  // E5xxx: Confirmation/token errors
  if (code.startsWith('E5')) return 400;

  return 500;
}
