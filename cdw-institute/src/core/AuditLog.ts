// Immutable log of all system actions

import { ZoneId } from './types.js';
import { ConstraintViolation } from './constraints.js';

export interface AuditEntry {
  timestamp: Date;
  action: string;
  zone: ZoneId | null;
  itemId: string | null;
  researcherNote: string | null;
  constraintViolation: ConstraintViolation | null;
}

export class AuditLog {
  private entries: AuditEntry[] = [];

  // Immutable log of all system actions

  logAction(entry: AuditEntry): void {
    // Add timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = new Date();
    }

    this.entries.push(entry);
  }

  getLog(): AuditEntry[] {
    // Return copy to maintain immutability
    return [...this.entries];
  }

  getViolations(): AuditEntry[] {
    return this.entries.filter(entry => entry.constraintViolation !== null);
  }

  // Export for review
  exportLog(): string {
    // JSON format
    return JSON.stringify(this.entries, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
  }
}
