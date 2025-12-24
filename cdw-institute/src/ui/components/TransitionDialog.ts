// Modal dialog for zone transitions - requires researcher note

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { WorkspaceItem, ZoneId } from '../../core/types.js';

// Modal dialog for zone transitions
// REQUIRES researcher to enter note explaining the transition
// Cannot be bypassed or auto-filled

export interface TransitionDialogProps {
  item: WorkspaceItem;
  fromZone: ZoneId;
  toZone: ZoneId;
  onConfirm: (researcherNote: string) => void;
  onCancel: () => void;
}

// Dialog must:
// - Display item title and current zone
// - Show target zone
// - Have text area for researcher note (required, min 10 characters)
// - Confirm button disabled until note meets minimum length

const MIN_NOTE_LENGTH = 10;

export function TransitionDialog({ item, fromZone, toZone, onConfirm, onCancel }: TransitionDialogProps) {
  const [note, setNote] = useState('');
  const isNoteValid = note.trim().length >= MIN_NOTE_LENGTH;

  const handleConfirm = () => {
    if (isNoteValid) {
      onConfirm(note.trim());
    }
  };

  return h('div', { class: 'modal-overlay' },
    h('div', { class: 'modal transition-dialog' },
      h('div', { class: 'modal-header' },
        h('h3', null, 'Transition Item')
      ),
      h('div', { class: 'modal-body' },
        h('div', { class: 'transition-info' },
          h('div', { class: 'info-row' },
            h('label', null, 'Item:'),
            h('span', null, item.title)
          ),
          h('div', { class: 'info-row' },
            h('label', null, 'From:'),
            h('span', null, formatZoneName(fromZone))
          ),
          h('div', { class: 'info-row' },
            h('label', null, 'To:'),
            h('span', null, formatZoneName(toZone))
          )
        ),
        h('div', { class: 'transition-note' },
          h('label', { for: 'researcher-note' },
            'Researcher Note (required, minimum 10 characters):'
          ),
          h('textarea', {
            id: 'researcher-note',
            rows: 4,
            value: note,
            onInput: (e: any) => setNote(e.target.value),
            placeholder: 'Explain why you are moving this item...'
          }),
          h('div', { class: 'note-length' },
            `${note.trim().length} / ${MIN_NOTE_LENGTH} characters minimum`
          )
        )
      ),
      h('div', { class: 'modal-footer' },
        h('button', {
          class: 'btn-cancel',
          onClick: onCancel
        }, 'Cancel'),
        h('button', {
          class: 'btn-confirm',
          onClick: handleConfirm,
          disabled: !isNoteValid
        }, 'Confirm Transition')
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
