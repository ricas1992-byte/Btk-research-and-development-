// The Reading Chair - exploratory engagement and contemplation

import { Zone } from './Zone.js';
import { WorkspaceItem, Result, Annotation } from '../core/types.js';
import { ConstraintViolation } from '../core/constraints.js';

export class ReadingChair extends Zone {
  readonly id = 'reading-chair' as const;
  readonly canProduceBindingJudgment = false;
  readonly maxCapacity = null; // Unlimited

  // Reading Chair specific: add exploratory annotation
  // Annotations here are ALWAYS provisional
  addAnnotation(itemId: string, annotation: Annotation): void {
    const item = this.items.get(itemId);
    if (!item) {
      return; // Item not in this zone
    }

    // Ensure annotation is marked as provisional
    annotation.isProvisional = true;

    item.annotations.push(annotation);
    item.modifiedAt = new Date();
  }

  // Items here are always 'provisional'
  addItem(item: WorkspaceItem, researcherNote: string): Result<void, ConstraintViolation> {
    // Validate researcher note
    if (!researcherNote || researcherNote.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // No capacity limit in Reading Chair

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
