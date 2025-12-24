// The Shelves - organized storage and retrieval

import { Zone } from './Zone.js';
import { WorkspaceItem, Result } from '../core/types.js';
import { ConstraintViolation } from '../core/constraints.js';

export class Shelves extends Zone {
  readonly id = 'shelves' as const;
  readonly canProduceBindingJudgment = false;
  readonly maxCapacity = null; // Unlimited

  private categories: Map<string, Set<string>>; // category -> item IDs

  constructor() {
    super();
    this.categories = new Map();
  }

  // Shelves specific: categorical organization
  assignCategory(itemId: string, category: string): void {
    const item = this.items.get(itemId);
    if (!item) {
      return; // Item not in this zone
    }

    // Remove from all categories first
    for (const [cat, itemIds] of this.categories.entries()) {
      itemIds.delete(itemId);
    }

    // Add to new category
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(itemId);
  }

  getByCategory(category: string): WorkspaceItem[] {
    const itemIds = this.categories.get(category);
    if (!itemIds) {
      return [];
    }

    const items: WorkspaceItem[] = [];
    for (const id of itemIds) {
      const item = this.items.get(id);
      if (item) {
        items.push(item);
      }
    }
    return items;
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  // Can store both provisional items and finalized Table Records
  addItem(item: WorkspaceItem, researcherNote: string): Result<void, ConstraintViolation> {
    // Validate researcher note
    if (!researcherNote || researcherNote.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // No capacity limit in Shelves

    // Update item zone (preserve existing epistemic status - can be provisional or binding)
    item.currentZone = this.id;
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

    // Remove from all categories
    for (const itemIds of this.categories.values()) {
      itemIds.delete(itemId);
    }

    this.items.delete(itemId);
    return { success: true, value: item };
  }
}
