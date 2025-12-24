// Special rendering for the Table - emphasizes judgment function

import { h } from 'preact';
import { ZoneViewProps } from './ZoneView.js';

// Special rendering for the Table
// Emphasizes:
// - Limited capacity (shows X/5)
// - "Under Judgment" status for items
// - Verdict rendering interface
// - High-friction add/remove (confirmation required)

export interface TableViewProps extends ZoneViewProps {
  onRenderVerdict: (verdict: string, reasoning: string) => void;
}

// Visual distinction: Table should look different from other zones
// Suggested: darker background, border emphasis, "JUDGMENT ZONE" label

export function TableView({ zone, onItemSelect, onRequestTransition, onRenderVerdict }: TableViewProps) {
  const items = zone.getItems();
  const itemCount = zone.getItemCount();
  const maxCapacity = 5;

  return h('div', { class: 'zone zone-table judgment-zone' },
    h('div', { class: 'zone-header table-header' },
      h('h2', null,
        h('span', { class: 'judgment-label' }, 'JUDGMENT ZONE'),
        ' The Table'
      ),
      h('div', { class: 'zone-capacity table-capacity' },
        `${itemCount}/${maxCapacity} items`,
        itemCount >= maxCapacity
          ? h('span', { class: 'capacity-warning' }, ' (FULL)')
          : null
      )
    ),
    h('div', { class: 'zone-description' },
      'Items on the Table are under judgment. Only verdicts rendered here are binding.'
    ),
    h('div', { class: 'zone-items table-items' },
      items.length === 0
        ? h('div', { class: 'zone-empty table-empty' },
            'The Table is empty. Move items here to render judgment.'
          )
        : items.map(item =>
            h('div', {
              key: item.id,
              class: 'zone-item table-item',
              onClick: () => onItemSelect(item.id)
            },
              h('div', { class: 'item-title' }, item.title),
              h('div', { class: 'item-status under-judgment' },
                'UNDER JUDGMENT'
              ),
              h('div', { class: 'item-controls' },
                h('button', {
                  class: 'btn-remove',
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    // High friction - require confirmation
                    if (confirm(`Remove "${item.title}" from the Table?\n\nThis item will no longer be under judgment.`)) {
                      // Trigger removal (implementation depends on parent component)
                    }
                  }
                }, 'Remove from Table')
              )
            )
          )
    ),
    items.length > 0
      ? h('div', { class: 'table-verdict-section' },
          h('button', {
            class: 'btn-render-verdict',
            onClick: () => {
              // Trigger verdict rendering interface
              // This is the core epistemic action
            }
          }, 'Render Verdict')
        )
      : null
  );
}
