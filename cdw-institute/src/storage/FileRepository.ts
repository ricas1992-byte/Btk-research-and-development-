// File-based repository implementation for CDW Institute

import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from './Repository.js';
import { WorkspaceItem, TableRecord, ZoneId } from '../core/types.js';

export class FileRepository implements Repository {
  private basePath: string;
  private itemsPath: string;
  private tableRecordsPath: string;
  private indexPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.itemsPath = path.join(basePath, 'items');
    this.tableRecordsPath = path.join(basePath, 'table-records');
    this.indexPath = path.join(basePath, 'index.json');
  }

  async initialize(): Promise<void> {
    // Create directory structure
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.mkdir(this.itemsPath, { recursive: true });
    await fs.mkdir(this.tableRecordsPath, { recursive: true });

    // Create index if it doesn't exist
    try {
      await fs.access(this.indexPath);
    } catch {
      await fs.writeFile(this.indexPath, JSON.stringify({}));
    }
  }

  async save(item: WorkspaceItem): Promise<void> {
    const itemPath = path.join(this.itemsPath, `${item.id}.json`);

    // Serialize dates properly
    const serialized = JSON.stringify(item, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);

    await fs.writeFile(itemPath, serialized);

    // Update index
    await this.updateIndex(item.id, item.currentZone);
  }

  async load(id: string): Promise<WorkspaceItem | null> {
    const itemPath = path.join(this.itemsPath, `${id}.json`);

    try {
      const content = await fs.readFile(itemPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Deserialize dates
      return this.deserializeItem(parsed);
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const itemPath = path.join(this.itemsPath, `${id}.json`);

    try {
      await fs.unlink(itemPath);
      await this.removeFromIndex(id);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async loadAll(): Promise<WorkspaceItem[]> {
    const files = await fs.readdir(this.itemsPath);
    const items: WorkspaceItem[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const item = await this.load(id);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  async saveTableRecord(record: TableRecord): Promise<void> {
    const recordPath = path.join(this.tableRecordsPath, `${record.id}.json`);

    // Serialize dates properly
    const serialized = JSON.stringify(record, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);

    await fs.writeFile(recordPath, serialized);
  }

  async loadTableRecords(): Promise<TableRecord[]> {
    const files = await fs.readdir(this.tableRecordsPath);
    const records: TableRecord[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const recordPath = path.join(this.tableRecordsPath, file);
        const content = await fs.readFile(recordPath, 'utf-8');
        const parsed = JSON.parse(content);

        // Deserialize dates
        records.push({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          finalizedAt: new Date(parsed.finalizedAt),
        });
      }
    }

    return records;
  }

  async loadByZone(zone: ZoneId): Promise<WorkspaceItem[]> {
    // Simple filter - no ranking/relevance
    const allItems = await this.loadAll();
    return allItems.filter(item => item.currentZone === zone);
  }

  // Helper methods

  private async updateIndex(id: string, zone: ZoneId): Promise<void> {
    const indexContent = await fs.readFile(this.indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    index[id] = zone;
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  private async removeFromIndex(id: string): Promise<void> {
    const indexContent = await fs.readFile(this.indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    delete index[id];
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  private deserializeItem(parsed: any): WorkspaceItem {
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      modifiedAt: new Date(parsed.modifiedAt),
      annotations: parsed.annotations.map((ann: any) => ({
        ...ann,
        createdAt: new Date(ann.createdAt),
      })),
      history: parsed.history.map((rec: any) => ({
        ...rec,
        timestamp: new Date(rec.timestamp),
      })),
    };
  }
}
