// ============================================
// AI Placeholder Buttons (NO ACTUAL AI)
// Buttons are UI-only placeholders per v5.2
// ============================================

import React, { useState } from 'react';
import type { Document, Note } from '@shared/types';

interface Props {
  document: Document;
  notes: Note[];
  onReadyToWrite: () => void;
}

export function AIPlaceholderButtons({ document, notes, onReadyToWrite }: Props) {
  const [placeholderMessage, setPlaceholderMessage] = useState<string | null>(null);

  const handlePlaceholderClick = (actionName: string) => {
    setPlaceholderMessage(`"${actionName}" would process here (AI is not integrated in v5.2)`);
    setTimeout(() => setPlaceholderMessage(null), 3000);
  };

  const isNotesPhase = document.writing_phase === 'NOTES';
  const isDraftingPhase = document.writing_phase === 'DRAFTING';
  const hasNotes = notes.filter(n => !n.is_locked).length > 0;
  const hasDraftContent = document.content.trim().length > 0;

  return (
    <div className="ai-placeholder-buttons">
      {placeholderMessage && (
        <div className="ai-placeholder-message">
          {placeholderMessage}
        </div>
      )}

      {isNotesPhase && (
        <>
          <button
            onClick={() => handlePlaceholderClick('Summarize My Notes')}
            disabled={!hasNotes}
            className="ai-button"
          >
            Summarize My Notes
          </button>

          <button
            onClick={onReadyToWrite}
            disabled={!hasNotes}
            className="ai-button primary"
          >
            Ready to Write
          </button>
        </>
      )}

      {isDraftingPhase && (
        <>
          <button
            onClick={() => handlePlaceholderClick('Prepare Draft')}
            className="ai-button"
          >
            Prepare Draft
          </button>

          <button
            onClick={() => handlePlaceholderClick('Rewrite for Clarity')}
            disabled={!hasDraftContent}
            className="ai-button"
          >
            Rewrite for Clarity
          </button>

          <button
            onClick={() => handlePlaceholderClick('Critique Logic')}
            disabled={!hasDraftContent}
            className="ai-button"
          >
            Critique Logic
          </button>
        </>
      )}
    </div>
  );
}
