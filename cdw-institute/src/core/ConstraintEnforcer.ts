// Central enforcement of all system constraints

import { WorkspaceItem, EpistemicStatus, ZoneId } from './types.js';
import { ConstraintViolation, CONSTRAINTS } from './constraints.js';

export class ConstraintEnforcer {
  // Central enforcement of all system constraints
  // Called before any state-changing operation

  // Check before adding to Table
  validateTableAddition(currentCount: number): ConstraintViolation | null {
    if (currentCount >= CONSTRAINTS.TABLE_MAX_CAPACITY) {
      return 'TABLE_CAPACITY_EXCEEDED';
    }
    return null;
  }

  // Check before any transition
  validateTransition(
    item: WorkspaceItem,
    fromZone: ZoneId,
    toZone: ZoneId,
    researcherNote: string
  ): ConstraintViolation | null {
    // Check researcher note is provided
    if (!researcherNote || researcherNote.trim().length === 0) {
      return 'MISSING_RESEARCHER_NOTE';
    }

    // Check binding status constraints
    // Binding items can only be in table or shelves
    if (item.epistemicStatus === 'binding') {
      if (toZone !== 'table' && toZone !== 'shelves') {
        return 'BINDING_STATUS_OUTSIDE_TABLE';
      }
    }

    return null;
  }

  // Check before status change
  validateStatusChange(
    item: WorkspaceItem,
    newStatus: EpistemicStatus,
    currentZone: ZoneId
  ): ConstraintViolation | null {
    // Returns violation if: newStatus is 'binding' AND currentZone is not 'table'
    if (newStatus === 'binding') {
      // Only the Table can assign binding status
      if (!CONSTRAINTS.BINDING_ZONES.includes(currentZone as any)) {
        return 'BINDING_STATUS_OUTSIDE_TABLE';
      }
    }

    return null;
  }

  // System-wide constraint check
  validateSystemState(workspace: {
    table: { getItems(): WorkspaceItem[] };
    sideDesk: { getItems(): WorkspaceItem[] };
    readingChair: { getItems(): WorkspaceItem[] };
    shelves: { getItems(): WorkspaceItem[] };
  }): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    // Checks:
    // - No binding items outside Table/Shelves
    const sideDeskItems = workspace.sideDesk.getItems();
    for (const item of sideDeskItems) {
      if (item.epistemicStatus === 'binding') {
        violations.push('BINDING_STATUS_OUTSIDE_TABLE');
      }
    }

    const readingChairItems = workspace.readingChair.getItems();
    for (const item of readingChairItems) {
      if (item.epistemicStatus === 'binding') {
        violations.push('BINDING_STATUS_OUTSIDE_TABLE');
      }
    }

    // - Table capacity not exceeded
    const tableItems = workspace.table.getItems();
    if (tableItems.length > CONSTRAINTS.TABLE_MAX_CAPACITY) {
      violations.push('TABLE_CAPACITY_EXCEEDED');
    }

    // Note: Auto-transitions and TableRecord validation would be checked
    // at the point of those operations, not in system-wide validation

    return violations;
  }
}
