// Main workspace component - renders all four zones

import { h } from 'preact';
import { Table } from '../zones/Table.js';
import { SideDesk } from '../zones/SideDesk.js';
import { ReadingChair } from '../zones/ReadingChair.js';
import { Shelves } from '../zones/Shelves.js';
import { TransitionManager } from '../zones/TransitionManager.js';
import { Repository } from '../storage/Repository.js';
import { ZoneId } from '../core/types.js';
import { ZoneView } from './components/ZoneView.js';
import { TableView } from './components/TableView.js';

// Main workspace component
// Renders all four zones in spatial arrangement

export class Workspace {
  private table: Table;
  private sideDesk: SideDesk;
  private readingChair: ReadingChair;
  private shelves: Shelves;
  private transitionManager: TransitionManager;
  private repository: Repository;

  constructor(repository: Repository) {
    this.repository = repository;
    this.table = new Table();
    this.sideDesk = new SideDesk();
    this.readingChair = new ReadingChair();
    this.shelves = new Shelves();
    this.transitionManager = new TransitionManager();
  }

  // Layout: Table prominent (center/top), Side Desk adjacent,
  // Reading Chair separate area, Shelves as sidebar/panel

  render() {
    return h('div', { class: 'workspace' },
      h('div', { class: 'workspace-main' },
        // Table - prominent position
        h('div', { class: 'workspace-table-area' },
          h(TableView, {
            zone: this.table,
            onItemSelect: (itemId) => this.handleItemSelect(itemId, 'table'),
            onRequestTransition: (itemId, targetZone) =>
              this.handleTransitionRequest(itemId, 'table', targetZone),
            onRenderVerdict: (verdict, reasoning) =>
              this.handleVerdictRequest(verdict, reasoning),
          })
        ),
        // Side Desk - adjacent to Table
        h('div', { class: 'workspace-side-desk-area' },
          h(ZoneView, {
            zone: this.sideDesk,
            onItemSelect: (itemId) => this.handleItemSelect(itemId, 'side-desk'),
            onRequestTransition: (itemId, targetZone) =>
              this.handleTransitionRequest(itemId, 'side-desk', targetZone),
          })
        )
      ),
      h('div', { class: 'workspace-sidebar' },
        // Reading Chair - separate area
        h('div', { class: 'workspace-reading-chair-area' },
          h(ZoneView, {
            zone: this.readingChair,
            onItemSelect: (itemId) => this.handleItemSelect(itemId, 'reading-chair'),
            onRequestTransition: (itemId, targetZone) =>
              this.handleTransitionRequest(itemId, 'reading-chair', targetZone),
          })
        ),
        // Shelves - sidebar/panel
        h('div', { class: 'workspace-shelves-area' },
          h(ZoneView, {
            zone: this.shelves,
            onItemSelect: (itemId) => this.handleItemSelect(itemId, 'shelves'),
            onRequestTransition: (itemId, targetZone) =>
              this.handleTransitionRequest(itemId, 'shelves', targetZone),
          })
        )
      )
    );
  }

  // All user actions must go through explicit handlers
  handleItemSelect(itemId: string, zone: ZoneId): void {
    // Handle item selection - to be implemented
    console.log(`Item selected: ${itemId} in ${zone}`);
  }

  handleTransitionRequest(itemId: string, fromZone: ZoneId, toZone: ZoneId): void {
    // Handle transition request - to be implemented
    console.log(`Transition requested: ${itemId} from ${fromZone} to ${toZone}`);
  }

  handleVerdictRequest(verdict: string, reasoning: string): void {
    // Handle verdict request - to be implemented
    console.log(`Verdict requested: ${verdict}`);
  }

  handleItemCreate(zone: ZoneId): void {
    // Handle item creation - to be implemented
    console.log(`Create item in ${zone}`);
  }

  // Explicitly NOT implemented:
  // No: handleAutoOrganize(), handleSuggest(), handleSmartSearch()

  // Getters for zones (for external access if needed)
  getTable(): Table { return this.table; }
  getSideDesk(): SideDesk { return this.sideDesk; }
  getReadingChair(): ReadingChair { return this.readingChair; }
  getShelves(): Shelves { return this.shelves; }
  getTransitionManager(): TransitionManager { return this.transitionManager; }
}
