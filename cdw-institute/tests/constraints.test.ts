// Tests for constraint enforcement

import { Table } from '../src/zones/Table';
import { SideDesk } from '../src/zones/SideDesk';
import { ReadingChair } from '../src/zones/ReadingChair';
import { Shelves } from '../src/zones/Shelves';
import { WorkspaceItem } from '../src/core/types';

describe('Constraint Enforcement', () => {
  test('Table rejects items beyond capacity', () => {
    const table = new Table();
    const items: WorkspaceItem[] = [];

    // Create 5 items
    for (let i = 0; i < 5; i++) {
      const item: WorkspaceItem = {
        id: `item-${i}`,
        createdAt: new Date(),
        modifiedAt: new Date(),
        title: `Item ${i}`,
        content: 'Content',
        sourceReferences: [],
        annotations: [],
        currentZone: 'reading-chair',
        epistemicStatus: 'provisional',
        history: [],
      };
      const result = table.addItem(item, `Adding item ${i}`);
      expect(result.success).toBe(true);
      items.push(item);
    }

    // Try to add 6th item - should fail
    const extraItem: WorkspaceItem = {
      id: 'item-extra',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Extra Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    const result = table.addItem(extraItem, 'Attempting to add 6th item');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe('TABLE_CAPACITY_EXCEEDED');
  });

  test('Binding status rejected outside Table', () => {
    const sideDesk = new SideDesk();
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'table',
      epistemicStatus: 'binding', // Invalid for Side Desk
      history: [],
    };

    const result = sideDesk.addItem(item, 'Adding binding item to side desk');
    // Side desk should accept it but change status to provisional
    expect(result.success).toBe(true);
    expect(item.epistemicStatus).toBe('provisional');
  });

  test('Transition rejected without researcher note', () => {
    const table = new Table();
    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'reading-chair',
      epistemicStatus: 'provisional',
      history: [],
    };

    const result = table.addItem(item, ''); // Empty note
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe('MISSING_RESEARCHER_NOTE');
  });

  test('Auto-transition is impossible', () => {
    // This test verifies that there are no auto-transition methods
    const table = new Table();

    // Verify that auto-transition methods don't exist
    expect((table as any).autoMove).toBeUndefined();
    expect((table as any).suggestMove).toBeUndefined();
    expect((table as any).batchMove).toBeUndefined();
  });

  test('Side Desk cannot produce binding judgment', () => {
    const sideDesk = new SideDesk();
    expect(sideDesk.canProduceBindingJudgment).toBe(false);
  });

  test('Reading Chair cannot produce binding judgment', () => {
    const readingChair = new ReadingChair();
    expect(readingChair.canProduceBindingJudgment).toBe(false);
  });

  test('Shelves cannot produce binding judgment', () => {
    const shelves = new Shelves();
    expect(shelves.canProduceBindingJudgment).toBe(false);
  });
});
