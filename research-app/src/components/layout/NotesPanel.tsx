// ============================================
// Layout: Notes Panel
// ============================================

import React, { useState } from 'react';
import type { Note } from '@shared/types';
import { Panel } from '@/components/common/Panel';
import { Button } from '@/components/common/Button';
import { NoteCard } from '@/components/research/NoteCard';
import { CONFIG } from '@shared/config';
import './NotesPanel.css';

interface NotesPanelProps {
  notes: Note[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNote: (content: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesPanel({
  notes,
  collapsed,
  onToggleCollapse,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const charCount = newNoteContent.length;
  const isOverLimit = charCount > CONFIG.NOTE_MAX_LENGTH;

  const handleAdd = () => {
    if (isOverLimit) {
      setError(`Maximum ${CONFIG.NOTE_MAX_LENGTH} characters`);
      return;
    }

    if (newNoteContent.trim().length === 0) {
      setError('Note cannot be empty');
      return;
    }

    onCreateNote(newNoteContent.trim());
    setNewNoteContent('');
    setIsAdding(false);
    setError(null);
  };

  const handleCancel = () => {
    setNewNoteContent('');
    setIsAdding(false);
    setError(null);
  };

  return (
    <Panel
      title="Notes"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      side="right"
      footer={
        !isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="secondary" fullWidth>
            Add Note
          </Button>
        )
      }
    >
      <div className="notes-list">
        {isAdding && (
          <div className="note-add-form">
            <textarea
              className="note-add-textarea"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write a note..."
              autoFocus
            />
            <div className="note-add-char-count">
              <span className={isOverLimit ? 'over-limit' : ''}>
                {charCount} / {CONFIG.NOTE_MAX_LENGTH}
              </span>
            </div>
            {error && <div className="note-add-error">{error}</div>}
            <div className="note-add-actions">
              <button onClick={handleAdd} disabled={isOverLimit}>
                Add
              </button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        )}

        {notes.length === 0 && !isAdding ? (
          <p className="notes-empty">No notes yet</p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
            />
          ))
        )}
      </div>
    </Panel>
  );
}
