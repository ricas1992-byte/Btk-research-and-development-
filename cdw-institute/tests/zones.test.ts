// Tests for zone behaviors

import { Table } from '../src/zones/Table';
import { SideDesk } from '../src/zones/SideDesk';
import { ReadingChair } from '../src/zones/ReadingChair';
import { Shelves } from '../src/zones/Shelves';
import { WorkspaceItem, Annotation } from '../src/core/types';

describe('Zone Behaviors', () => {
  describe('Table', () => {
    test('Max capacity is 5', () => {
      const table = new Table();
      expect(table.maxCapacity).toBe(5);
    });

    test('canProduceBindingJudgment is true', () => {
      const table = new Table();
      expect(table.canProduceBindingJudgment).toBe(true);
    });

    test('Items enter as under-judgment status', () => {
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

      table.addItem(item, 'Adding item to table');
      expect(item.epistemicStatus).toBe('under-judgment');
    });
  });

  describe('Side Desk', () => {
    test('canProduceBindingJudgment is false', () => {
      const sideDesk = new SideDesk();
      expect(sideDesk.canProduceBindingJudgment).toBe(false);
    });

    test('Items are always provisional', () => {
      const sideDesk = new SideDesk();
      const item: WorkspaceItem = {
        id: 'item-1',
        createdAt: new Date(),
        modifiedAt: new Date(),
        title: 'Test Item',
        content: 'Content',
        sourceReferences: [],
        annotations: [],
        currentZone: 'reading-chair',
        epistemicStatus: 'under-judgment',
        history: [],
      };

      sideDesk.addItem(item, 'Adding item to side desk');
      expect(item.epistemicStatus).toBe('provisional');
    });
  });

  describe('Reading Chair', () => {
    test('canProduceBindingJudgment is false', () => {
      const readingChair = new ReadingChair();
      expect(readingChair.canProduceBindingJudgment).toBe(false);
    });

    test('Annotations are always provisional', () => {
      const readingChair = new ReadingChair();
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

      readingChair.addItem(item, 'Adding item to reading chair');

      const annotation: Annotation = {
        id: 'ann-1',
        createdAt: new Date(),
        content: 'Test annotation',
        isProvisional: false, // Will be forced to true
      };

      readingChair.addAnnotation(item.id, annotation);

      expect(annotation.isProvisional).toBe(true);
    });

    test('No capacity limit', () => {
      const readingChair = new ReadingChair();
      expect(readingChair.maxCapacity).toBeNull();
    });
  });

  describe('Shelves', () => {
    test('canProduceBindingJudgment is false', () => {
      const shelves = new Shelves();
      expect(shelves.canProduceBindingJudgment).toBe(false);
    });

    test('Can store both provisional and binding items', () => {
      const shelves = new Shelves();

      const provisionalItem: WorkspaceItem = {
        id: 'item-1',
        createdAt: new Date(),
        modifiedAt: new Date(),
        title: 'Provisional Item',
        content: 'Content',
        sourceReferences: [],
        annotations: [],
        currentZone: 'reading-chair',
        epistemicStatus: 'provisional',
        history: [],
      };

      const bindingItem: WorkspaceItem = {
        id: 'item-2',
        createdAt: new Date(),
        modifiedAt: new Date(),
        title: 'Binding Item',
        content: 'Content',
        sourceReferences: [],
        annotations: [],
        currentZone: 'table',
        epistemicStatus: 'binding',
        history: [],
      };

      shelves.addItem(provisionalItem, 'Archiving provisional item');
      shelves.addItem(bindingItem, 'Archiving binding item');

      expect(provisionalItem.epistemicStatus).toBe('provisional');
      expect(bindingItem.epistemicStatus).toBe('binding');
    });
  });
});
