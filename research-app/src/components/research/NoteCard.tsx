// ============================================
// Research: Note Card
// ============================================

import React, { useState } from 'react';
import type { Note } from '@shared/types';
import { CONFIG } from '@shared/config';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [error, setError] = useState<string | null>(null);

  const isLocked = note.is_locked === 1;
  const charCount = editContent.length;
  const isOverLimit = charCount > CONFIG.NOTE_MAX_LENGTH;

  const handleSave = () => {
    if (isOverLimit) {
      setError(`Maximum ${CONFIG.NOTE_MAX_LENGTH} characters`);
      return;
    }

    if (editContent.trim().length === 0) {
      setError('Note cannot be empty');
      return;
    }

    onUpdate(note.id, editContent.trim());
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className={`note-card ${isLocked ? 'locked' : ''}`}>
      {isEditing ? (
        <div className="note-card-edit">
          <textarea
            className="note-card-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="note-card-char-count">
            <span className={isOverLimit ? 'over-limit' : ''}>
              {charCount} / {CONFIG.NOTE_MAX_LENGTH}
            </span>
          </div>
          {error && <div className="note-card-error">{error}</div>}
          <div className="note-card-actions">
            <button onClick={handleSave} disabled={isOverLimit}>
              Save
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="note-card-view">
          <p className="note-card-content">{note.content}</p>
          {note.source_id && (
            <span className="note-card-source">From source</span>
          )}
          {!isLocked && (
            <div className="note-card-actions">
              <button onClick={() => setIsEditing(true)}>Edit</button>
              <button onClick={() => onDelete(note.id)} className="delete">
                Delete
              </button>
            </div>
          )}
          {isLocked && <span className="note-card-locked">🔒 Locked</span>}
        </div>
      )}
    </div>
  );
}
