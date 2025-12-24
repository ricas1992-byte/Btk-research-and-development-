// Display for finalized Table Records - read-only and marked as binding

import { h } from 'preact';
import { TableRecord } from '../../core/types.js';

// Display for finalized Table Records
// These are read-only and marked as binding

export interface TableRecordViewProps {
  record: TableRecord;
}

// Must display:
// - "BINDING JUDGMENT" label prominently
// - Finalization date
// - Verdict text
// - Reasoning text
// - List of items that were on Table during judgment
// - No edit capability (read-only)

export function TableRecordView({ record }: TableRecordViewProps) {
  return h('div', { class: 'table-record' },
    h('div', { class: 'record-header' },
      h('div', { class: 'binding-badge' }, 'BINDING JUDGMENT'),
      h('div', { class: 'record-date' },
        `Finalized: ${record.finalizedAt.toLocaleString()}`
      )
    ),
    h('div', { class: 'record-body' },
      h('div', { class: 'record-section' },
        h('h4', null, 'Verdict'),
        h('div', { class: 'verdict-text' }, record.verdict)
      ),
      h('div', { class: 'record-section' },
        h('h4', null, 'Reasoning'),
        h('div', { class: 'reasoning-text' }, record.reasoning)
      ),
      h('div', { class: 'record-section' },
        h('h4', null, 'Supporting Items'),
        h('ul', { class: 'supporting-items-list' },
          record.supportingItems.map(itemId =>
            h('li', { key: itemId }, itemId)
          )
        )
      ),
      h('div', { class: 'record-metadata' },
        h('div', null, `Record ID: ${record.id}`),
        h('div', null, `Created: ${record.createdAt.toLocaleString()}`)
      )
    ),
    h('div', { class: 'record-footer' },
      h('div', { class: 'readonly-notice' },
        'This is a finalized judgment and cannot be edited.'
      )
    )
  );
}
