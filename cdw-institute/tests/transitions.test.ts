// Tests for zone transitions

import { Table } from '../src/zones/Table';
import { SideDesk } from '../src/zones/SideDesk';
import { TransitionManager } from '../src/zones/TransitionManager';
import { WorkspaceItem } from '../src/core/types';

describe('Zone Transitions', () => {
  test('Transition records researcher note', () => {
    const sideDesk = new SideDesk();
    const table = new Table();
    const transitionManager = new TransitionManager();

    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'side-desk',
      epistemicStatus: 'provisional',
      history: [],
    };

    sideDesk.addItem(item, 'Initial addition to side desk');

    const result = transitionManager.moveItem(
      item.id,
      sideDesk,
      table,
      'Moving to table for judgment'
    );

    expect(result.success).toBe(true);
    expect(item.history.length).toBeGreaterThan(0);
    const lastTransition = item.history[item.history.length - 1];
    expect(lastTransition.researcherNote).toBe('Moving to table for judgment');
  });

  test('Transition updates item history', () => {
    const sideDesk = new SideDesk();
    const table = new Table();
    const transitionManager = new TransitionManager();

    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'side-desk',
      epistemicStatus: 'provisional',
      history: [],
    };

    sideDesk.addItem(item, 'Initial addition');
    const initialHistoryLength = item.history.length;

    transitionManager.moveItem(
      item.id,
      sideDesk,
      table,
      'Moving to table for judgment'
    );

    expect(item.history.length).toBeGreaterThan(initialHistoryLength);
  });

  test('Transition validates target zone constraints', () => {
    const sideDesk = new SideDesk();
    const table = new Table();
    const transitionManager = new TransitionManager();

    // Fill the table to capacity
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
      table.addItem(item, `Adding item ${i}`);
    }

    // Try to move an item from side desk to full table
    const extraItem: WorkspaceItem = {
      id: 'extra-item',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Extra Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'side-desk',
      epistemicStatus: 'provisional',
      history: [],
    };

    sideDesk.addItem(extraItem, 'Adding to side desk');

    const result = transitionManager.moveItem(
      extraItem.id,
      sideDesk,
      table,
      'Attempting to move to full table'
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe('TABLE_CAPACITY_EXCEEDED');
  });

  test('Empty researcher note is rejected', () => {
    const sideDesk = new SideDesk();
    const table = new Table();
    const transitionManager = new TransitionManager();

    const item: WorkspaceItem = {
      id: 'item-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
      title: 'Test Item',
      content: 'Content',
      sourceReferences: [],
      annotations: [],
      currentZone: 'side-desk',
      epistemicStatus: 'provisional',
      history: [],
    };

    sideDesk.addItem(item, 'Initial addition');

    const result = transitionManager.moveItem(
      item.id,
      sideDesk,
      table,
      '' // Empty note
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe('MISSING_RESEARCHER_NOTE');
  });
});
