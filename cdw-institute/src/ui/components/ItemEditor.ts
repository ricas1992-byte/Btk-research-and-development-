// Editor for workspace items - plain text only, no AI assistance

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { WorkspaceItem } from '../../core/types.js';

// Editor for workspace items
// Plain text editing only - no AI assistance

export interface ItemEditorProps {
  item: WorkspaceItem;
  onSave: (updatedItem: WorkspaceItem) => void;
  onCancel: () => void;
  isReadOnly: boolean; // True for binding Table Records
}

// Editor must NOT include:
// - AI writing assistance
// - Auto-complete
// - Suggestion popups
// - Grammar/style checking beyond browser native

export function ItemEditor({ item, onSave, onCancel, isReadOnly }: ItemEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [sources, setSources] = useState(item.sourceReferences.join('\n'));

  const handleSave = () => {
    const updatedItem: WorkspaceItem = {
      ...item,
      title: title.trim(),
      content: content.trim(),
      sourceReferences: sources.split('\n').map(s => s.trim()).filter(s => s.length > 0),
      modifiedAt: new Date(),
    };
    onSave(updatedItem);
  };

  return h('div', { class: 'item-editor' },
    h('div', { class: 'editor-header' },
      h('h3', null, isReadOnly ? 'View Item' : 'Edit Item'),
      isReadOnly
        ? h('span', { class: 'readonly-badge' }, 'READ-ONLY (Binding)')
        : null
    ),
    h('div', { class: 'editor-body' },
      h('div', { class: 'form-group' },
        h('label', { for: 'item-title' }, 'Title'),
        h('input', {
          id: 'item-title',
          type: 'text',
          value: title,
          onInput: (e: any) => setTitle(e.target.value),
          disabled: isReadOnly,
          placeholder: 'Item title...'
        })
      ),
      h('div', { class: 'form-group' },
        h('label', { for: 'item-content' }, 'Content'),
        h('textarea', {
          id: 'item-content',
          rows: 15,
          value: content,
          onInput: (e: any) => setContent(e.target.value),
          disabled: isReadOnly,
          placeholder: 'Item content...'
        })
      ),
      h('div', { class: 'form-group' },
        h('label', { for: 'item-sources' }, 'Source References (one per line)'),
        h('textarea', {
          id: 'item-sources',
          rows: 5,
          value: sources,
          onInput: (e: any) => setSources(e.target.value),
          disabled: isReadOnly,
          placeholder: 'Source references...'
        })
      ),
      h('div', { class: 'item-metadata' },
        h('div', null, `Zone: ${item.currentZone}`),
        h('div', null, `Status: ${item.epistemicStatus}`),
        h('div', null, `Created: ${item.createdAt.toLocaleString()}`),
        h('div', null, `Modified: ${item.modifiedAt.toLocaleString()}`)
      )
    ),
    h('div', { class: 'editor-footer' },
      h('button', {
        class: 'btn-cancel',
        onClick: onCancel
      }, isReadOnly ? 'Close' : 'Cancel'),
      !isReadOnly
        ? h('button', {
            class: 'btn-save',
            onClick: handleSave
          }, 'Save')
        : null
    )
  );
}
