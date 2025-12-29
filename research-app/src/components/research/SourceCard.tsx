// ============================================
// Research: Source Card
// ============================================

import React from 'react';
import type { Source } from '@shared/types';
import './SourceCard.css';

interface SourceCardProps {
  source: Source;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function SourceCard({
  source,
  isSelected,
  onClick,
  onDelete,
}: SourceCardProps) {
  return (
    <div
      className={`source-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="source-card-header">
        <h3 className="source-card-title">{source.title}</h3>
        <span className="source-card-type">{source.source_type}</span>
      </div>
      {source.source_url && (
        <p className="source-card-url">{source.source_url}</p>
      )}
      {onDelete && (
        <button
          className="source-card-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete source"
        >
          ×
        </button>
      )}
    </div>
  );
}
