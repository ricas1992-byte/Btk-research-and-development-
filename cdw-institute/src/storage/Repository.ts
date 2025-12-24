// Repository interface for CDW Institute storage

import { WorkspaceItem, TableRecord, ZoneId } from '../core/types.js';

export interface Repository {
  // Basic CRUD - no smart features
  save(item: WorkspaceItem): Promise<void>;
  load(id: string): Promise<WorkspaceItem | null>;
  delete(id: string): Promise<void>;
  loadAll(): Promise<WorkspaceItem[]>;

  // Table Records are stored separately (they are binding)
  saveTableRecord(record: TableRecord): Promise<void>;
  loadTableRecords(): Promise<TableRecord[]>;

  // Query by zone - simple filter, no ranking/relevance
  loadByZone(zone: ZoneId): Promise<WorkspaceItem[]>;

  // Explicitly NOT implemented:
  // No: search(), findSimilar(), recommend(), autoTag()
}
