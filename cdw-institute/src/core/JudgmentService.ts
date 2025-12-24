// Service for executing binding judgments at the Table

import { Table } from '../zones/Table.js';
import { Repository } from '../storage/Repository.js';
import { TableRecord, Result } from './types.js';
import { ConstraintViolation } from './constraints.js';

export class JudgmentService {
  constructor(
    private table: Table,
    private repository: Repository
  ) {}

  // Validate pre-conditions for judgment
  canRenderJudgment(): boolean {
    // Returns true only if: Table has items, all items are 'under-judgment'
    const items = this.table.getItems();

    if (items.length === 0) {
      return false;
    }

    // All items must have 'under-judgment' status
    for (const item of items) {
      if (item.epistemicStatus !== 'under-judgment') {
        return false;
      }
    }

    return true;
  }

  // Execute judgment - creates binding TableRecord
  async executeJudgment(verdict: string, reasoning: string): Promise<Result<TableRecord, ConstraintViolation>> {
    // Steps:
    // 1. Validate Table state
    if (!this.canRenderJudgment()) {
      return { success: false, error: 'MISSING_RESEARCHER_NOTE' };
    }

    // 2. Create TableRecord with isBinding: true
    const verdictResult = this.table.renderVerdict(verdict, reasoning);
    if (!verdictResult.success) {
      return verdictResult;
    }

    const tableRecord = verdictResult.value;

    // 3. Update all items to epistemicStatus: 'binding'
    const items = this.table.getItems();
    for (const item of items) {
      const finalizeResult = this.table.finalizeItem(item.id);
      if (!finalizeResult.success) {
        return { success: false, error: finalizeResult.error };
      }

      // 4. Save each updated item to repository
      await this.repository.save(item);
    }

    // 5. Save TableRecord to repository
    await this.repository.saveTableRecord(tableRecord);

    // 6. Return TableRecord
    return { success: true, value: tableRecord };
  }

  // Get all past judgments
  async getJudgmentHistory(): Promise<TableRecord[]> {
    return await this.repository.loadTableRecords();
  }
}
