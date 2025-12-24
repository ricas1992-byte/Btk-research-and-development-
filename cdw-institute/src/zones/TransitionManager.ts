// Transition Manager - enforces manual transitions between zones

import { Zone } from './Zone.js';
import { WorkspaceItem, Result } from '../core/types.js';
import { ConstraintViolation } from '../core/constraints.js';

export class TransitionManager {
  // The ONLY way to move items between zones
  // Enforces: explicit researcher action, no automation
  moveItem(
    itemId: string,
    fromZone: Zone,
    toZone: Zone,
    researcherNote: string // REQUIRED - cannot be empty
  ): Result<void, ConstraintViolation> {
    // Validate researcher note first
    if (!researcherNote || researcherNote.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // Get the item from the source zone
    const item = fromZone.getItem(itemId);
    if (!item) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // Validate transition
    const violation = this.validateTransition(item, toZone);
    if (violation) {
      return { success: false, error: violation };
    }

    // Remove from source zone
    const removeResult = fromZone.removeItem(itemId, researcherNote);
    if (!removeResult.success) {
      return removeResult as Result<void, ConstraintViolation>;
    }

    // Add to destination zone
    const addResult = toZone.addItem(item, researcherNote);
    if (!addResult.success) {
      // Rollback: add back to source zone
      fromZone.addItem(item, 'Rollback from failed transition');
      return addResult;
    }

    return { success: true, value: undefined };
  }

  // Explicitly NOT implemented:
  // No: autoMove(), suggestMove(), batchMove(), scheduledMove()

  // Validation before any move
  private validateTransition(item: WorkspaceItem, toZone: Zone): ConstraintViolation | null {
    // Check capacity constraints
    if (toZone.maxCapacity !== null && toZone.getItemCount() >= toZone.maxCapacity) {
      return 'TABLE_CAPACITY_EXCEEDED';
    }

    // Check binding status constraints
    // Binding items can only be in table or shelves
    if (item.epistemicStatus === 'binding') {
      if (toZone.id !== 'table' && toZone.id !== 'shelves') {
        return 'BINDING_STATUS_OUTSIDE_TABLE';
      }
    }

    return null;
  }
}
