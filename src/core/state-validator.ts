import { ValidationError } from '../types/errors.js';

/**
 * Validates entity fields and constraints.
 * Used before state machine transitions and database operations.
 */

export function validateTitle(title: string, fieldName: string = 'title'): void {
  if (typeof title !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  const trimmed = title.trim();
  if (trimmed.length < 1) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
  if (trimmed.length > 500) {
    throw new ValidationError(`${fieldName} cannot exceed 500 characters`);
  }
}

export function validateProjectName(name: string): void {
  if (typeof name !== 'string') {
    throw new ValidationError('name must be a string');
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    throw new ValidationError('name cannot be empty');
  }
  if (trimmed.length > 200) {
    throw new ValidationError('name cannot exceed 200 characters');
  }
}

export function validateDescription(description: string): void {
  if (typeof description !== 'string') {
    throw new ValidationError('description must be a string');
  }
}

export function validateContent(content: string, fieldName: string = 'content'): void {
  if (typeof content !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
}

export function validateUUID(id: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}

export function validateConfirmation(confirmation: string, expected: string, action: string): void {
  if (confirmation !== expected) {
    throw new ValidationError(`Invalid confirmation. Type "${expected}" to ${action}`, {
      expected,
      received: confirmation,
    });
  }
}
