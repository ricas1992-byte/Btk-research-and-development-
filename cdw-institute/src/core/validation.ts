// Validation functions for CDW Institute constraints

import { WorkspaceItem, TransitionRecord, TableRecord, EpistemicStatus } from './types.js';

// Validates that only Table can produce binding status
export function validateEpistemicStatus(item: WorkspaceItem): boolean {
  // If item has binding status, it must be in 'table' or 'shelves' zone
  if (item.epistemicStatus === 'binding') {
    return item.currentZone === 'table' || item.currentZone === 'shelves';
  }
  return true;
}

// Validates that transitions include researcher note
export function validateTransition(record: TransitionRecord): boolean {
  // Researcher note must exist and not be empty (whitespace only is invalid)
  return (
    typeof record.researcherNote === 'string' &&
    record.researcherNote.trim().length > 0
  );
}

// Validates Table capacity constraint
export function validateTableCapacity(currentCount: number): boolean {
  return currentCount < 5; // Max capacity is 5
}

// Validates that TableRecord has required fields
export function validateTableRecord(record: TableRecord): boolean {
  return (
    typeof record.id === 'string' && record.id.length > 0 &&
    record.createdAt instanceof Date &&
    record.finalizedAt instanceof Date &&
    typeof record.verdict === 'string' && record.verdict.trim().length > 0 &&
    typeof record.reasoning === 'string' && record.reasoning.trim().length > 0 &&
    Array.isArray(record.supportingItems) &&
    record.isBinding === true // Must be literal true
  );
}
