// ============================================
// Research: Draft View
// ============================================

import React from 'react';
import './DraftView.css';

interface DraftViewProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

export function DraftView({ content, onChange, disabled = false }: DraftViewProps) {
  return (
    <div className="draft-view">
      <textarea
        className="draft-editor"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Start writing..."
        spellCheck
      />
    </div>
  );
}
