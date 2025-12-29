// ============================================
// Research: Source View
// ============================================

import React from 'react';
import type { Source } from '@shared/types';
import { Button } from '@/components/common/Button';
import './SourceView.css';

interface SourceViewProps {
  source: Source;
  onBack: () => void;
}

export function SourceView({ source, onBack }: SourceViewProps) {
  return (
    <div className="source-view">
      <div className="source-view-header">
        <Button onClick={onBack} variant="secondary">
          ← Back to Writing
        </Button>
      </div>
      <div className="source-view-content">
        <h1 className="source-view-title">{source.title}</h1>
        {source.source_url && (
          <p className="source-view-url">
            <a href={source.source_url} target="_blank" rel="noopener noreferrer">
              {source.source_url}
            </a>
          </p>
        )}
        <div className="source-view-text">{source.content}</div>
      </div>
    </div>
  );
}
