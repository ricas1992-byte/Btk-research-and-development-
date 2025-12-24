// Abstract base class for all zones

import { ZoneId, WorkspaceItem, Result } from '../core/types.js';
import { ConstraintViolation } from '../core/constraints.js';

export abstract class Zone {
  abstract readonly id: ZoneId;
  abstract readonly canProduceBindingJudgment: boolean;
  abstract readonly maxCapacity: number | null;

  protected items: Map<string, WorkspaceItem>;

  constructor() {
    this.items = new Map();
  }

  // All zones must implement these
  abstract addItem(item: WorkspaceItem, researcherNote: string): Result<void, ConstraintViolation>;
  abstract removeItem(itemId: string, researcherNote: string): Result<WorkspaceItem, ConstraintViolation>;

  getItems(): WorkspaceItem[] {
    return Array.from(this.items.values());
  }

  getItem(itemId: string): WorkspaceItem | undefined {
    return this.items.get(itemId);
  }

  getItemCount(): number {
    return this.items.size;
  }

  hasItem(itemId: string): boolean {
    return this.items.has(itemId);
  }

  // Explicitly NOT implemented - no zone has automatic behavior
  // No: autoOrganize(), suggest(), synthesize(), recommend()
}
