// The Table - sole site of binding judgment

import { Zone } from './Zone.js';
import { WorkspaceItem, Result, TableRecord } from '../core/types.js';
import { ConstraintViolation, CONSTRAINTS } from '../core/constraints.js';

export class Table extends Zone {
  readonly id = 'table' as const;
  readonly canProduceBindingJudgment = true; // ONLY zone where this is true
  readonly maxCapacity = 5;

  // Table-specific: create binding judgment
  renderVerdict(verdict: string, reasoning: string): Result<TableRecord, ConstraintViolation> {
    // Validate that verdict and reasoning are provided
    if (!verdict || verdict.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }
    if (!reasoning || reasoning.trim().length === 0) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // Create TableRecord
    const record: TableRecord = {
      id: `table-record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      finalizedAt: new Date(),
      verdict: verdict.trim(),
      reasoning: reasoning.trim(),
      supportingItems: Array.from(this.items.keys()),
      isBinding: true, // Literal true
    };

    return { success: true, value: record };
  }

  // Table-specific: finalize item's epistemic status to 'binding'
  finalizeItem(itemId: string): Result<void, ConstraintViolation> {
    const item = this.items.get(itemId);
    if (!item) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // Update status to binding
    item.epistemicStatus = 'binding';
    item.modifiedAt = new Date();

    return { success: true, value: undefined };
  }

  // Override add to enforce capacity and set status to 'under-judgment'
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
    item.epistemicStatus = 'under-judgment';
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
