// Base component for rendering a zone

import { h } from 'preact';
import { Zone } from '../../zones/Zone.js';
import { ZoneId } from '../../core/types.js';

export interface ZoneViewProps {
  zone: Zone;
  onItemSelect: (itemId: string) => void;
  onRequestTransition: (itemId: string, targetZone: ZoneId) => void;
}

// Renders:
// - Zone name and description
// - Current item count / capacity
// - List of items in zone
// - Manual controls for each item (no drag-drop auto-transition)

export function ZoneView({ zone, onItemSelect, onRequestTransition }: ZoneViewProps) {
  const items = zone.getItems();
  const capacityText = zone.maxCapacity
    ? `${zone.getItemCount()}/${zone.maxCapacity}`
    : `${zone.getItemCount()}`;

  const zoneName = formatZoneName(zone.id);

  return h('div', { class: `zone zone-${zone.id}` },
    h('div', { class: 'zone-header' },
      h('h2', null, zoneName),
      h('div', { class: 'zone-capacity' }, `Items: ${capacityText}`)
    ),
    h('div', { class: 'zone-items' },
      items.length === 0
        ? h('div', { class: 'zone-empty' }, 'No items in this zone')
        : items.map(item =>
            h('div', {
              key: item.id,
              class: 'zone-item',
              onClick: () => onItemSelect(item.id)
            },
              h('div', { class: 'item-title' }, item.title),
              h('div', { class: 'item-status' }, item.epistemicStatus),
              h('div', { class: 'item-controls' },
                h('button', {
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    // User must manually select target zone
                    // No automatic suggestions
                  }
                }, 'Move...')
              )
            )
          )
    )
  );
}

function formatZoneName(id: ZoneId): string {
  switch (id) {
    case 'table': return 'The Table';
    case 'side-desk': return 'Side Desk';
    case 'reading-chair': return 'Reading Chair';
    case 'shelves': return 'Shelves';
  }
}
