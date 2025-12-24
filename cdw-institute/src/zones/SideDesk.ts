// The Side Desk - active preparation and marshaling space

import { Zone } from './Zone.js';
import { WorkspaceItem, Result } from '../core/types.js';
import { ConstraintViolation, CONSTRAINTS } from '../core/constraints.js';

export class SideDesk extends Zone {
  readonly id = 'side-desk' as const;
  readonly canProduceBindingJudgment = false; // Explicitly false
  readonly maxCapacity = 20;

  // Side Desk specific: organize items for Table preparation
  // Note: This is manual organization, NOT automated sorting
  reorderItems(itemIds: string[]): void {
    // This is a manual reordering operation
    // No automatic sorting or intelligence applied
    // The researcher explicitly provides the desired order

    // Validate that all IDs exist in this zone
    for (const id of itemIds) {
      if (!this.items.has(id)) {
        return; // Silently fail if any ID is invalid
      }
    }

    // Manual reordering would be implemented by maintaining an order array
    // For now, this is a placeholder for the UI to use
  }

  // Items here are always 'provisional'
  addItem(item: WorkspaceItem, researcherNote: string): Result<void, ConstraintViolation> {
    // Validate researcher note
    if (!researcherNote || researcherNote.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // Check capacity
    if (this.items.size >= this.maxCapacity) {
      return { success: false, error: 'TABLE_CAPACITY_EXCEEDED' };
    }

    // Update item status and zone
    item.currentZone = this.id;
    item.epistemicStatus = 'provisional'; // Always provisional
    item.modifiedAt = new Date();

    // Add transition record
    item.history.push({
      timestamp: new Date(),
      fromZone: item.history.length > 0 ? item.history[item.history.length - 1].toZone : null,
      toZone: this.id,
      researcherNote: researcherNote.trim(),
    });

    this.items.set(item.id, item);
    return { success: true, value: undefined };
  }

  removeItem(itemId: string, researcherNote: string): Result<WorkspaceItem, ConstraintViolation> {
    // Validate researcher note
    if (!researcherNote || researcherNote.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    const item = this.items.get(itemId);
    if (!item) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    this.items.delete(itemId);
    return { success: true, value: item };
  }
}
