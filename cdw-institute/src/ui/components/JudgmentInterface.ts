// The interface for rendering verdicts at the Table - the core epistemic action

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { WorkspaceItem } from '../../core/types.js';

// The interface for rendering verdicts at the Table
// This is the core epistemic action of the system

export interface JudgmentInterfaceProps {
  itemsOnTable: WorkspaceItem[];
  onVerdictSubmit: (verdict: string, reasoning: string) => void;
  onCancel: () => void;
}

// Interface must:
// - Display all items currently on Table (max 5)
// - Provide text area for verdict (required)
// - Provide text area for reasoning (required)
// - Show clear warning: "This verdict will be BINDING"
// - Require confirmation: "I understand this judgment is final"
// - Create TableRecord upon submission

// Interface must NOT:
// - Suggest verdicts
// - Auto-generate reasoning
// - Provide templates
// - Offer AI assistance

export function JudgmentInterface({ itemsOnTable, onVerdictSubmit, onCancel }: JudgmentInterfaceProps) {
  const [verdict, setVerdict] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const isVerdictValid = verdict.trim().length > 0;
  const isReasoningValid = reasoning.trim().length > 0;
  const canSubmit = isVerdictValid && isReasoningValid && confirmationChecked;

  const handleSubmit = () => {
    if (canSubmit) {
      onVerdictSubmit(verdict.trim(), reasoning.trim());
    }
  };

  return h('div', { class: 'modal-overlay' },
    h('div', { class: 'modal judgment-interface' },
      h('div', { class: 'modal-header judgment-header' },
        h('h3', null, 'Render Binding Judgment')
      ),
      h('div', { class: 'modal-body' },
        h('div', { class: 'binding-warning' },
          h('strong', null, '⚠ WARNING: This verdict will be BINDING'),
          h('p', null, 'Once submitted, this judgment becomes a permanent part of your research record.')
        ),
        h('div', { class: 'items-under-judgment' },
          h('h4', null, 'Items Under Judgment'),
          h('ul', null,
            itemsOnTable.map(item =>
              h('li', { key: item.id }, item.title)
            )
          )
        ),
        h('div', { class: 'form-group' },
          h('label', { for: 'verdict-text' },
            h('strong', null, 'Verdict (required)')
          ),
          h('textarea', {
            id: 'verdict-text',
            rows: 6,
            value: verdict,
            onInput: (e: any) => setVerdict(e.target.value),
            placeholder: 'State your binding judgment...'
          })
        ),
        h('div', { class: 'form-group' },
          h('label', { for: 'reasoning-text' },
            h('strong', null, 'Reasoning (required)')
          ),
          h('textarea', {
            id: 'reasoning-text',
            rows: 10,
            value: reasoning,
            onInput: (e: any) => setReasoning(e.target.value),
            placeholder: 'Explain the reasoning behind your judgment...'
          })
        ),
        h('div', { class: 'confirmation-checkbox' },
          h('label', null,
            h('input', {
              type: 'checkbox',
              checked: confirmationChecked,
              onChange: (e: any) => setConfirmationChecked(e.target.checked)
            }),
            ' ',
            h('strong', null, 'I understand this judgment is final and binding')
          )
        )
      ),
      h('div', { class: 'modal-footer' },
        h('button', {
          class: 'btn-cancel',
          onClick: onCancel
        }, 'Cancel'),
        h('button', {
          class: 'btn-submit-judgment',
          onClick: handleSubmit,
          disabled: !canSubmit
        }, 'Submit Binding Judgment')
      )
    )
  );
}
