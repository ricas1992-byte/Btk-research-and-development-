// ============================================
// Layout: Sources Panel
// ============================================

import React from 'react';
import type { Source } from '@shared/types';
import { Panel } from '@/components/common/Panel';
import { Button } from '@/components/common/Button';
import { SourceCard } from '@/components/research/SourceCard';
import './SourcesPanel.css';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSource: (sourceId: string) => void;
  onDeleteSource?: (sourceId: string) => void;
}

export function SourcesPanel({
  sources,
  selectedSourceId,
  collapsed,
  onToggleCollapse,
  onSelectSource,
  onDeleteSource,
}: SourcesPanelProps) {
  const handleAddSource = () => {
    // No-op per specification - source ingestion deferred
    console.log('Add Source clicked - functionality not implemented (deferred)');
  };

  return (
    <Panel
      title="Sources"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      side="left"
      footer={
        <Button onClick={handleAddSource} variant="secondary" fullWidth>
          Add Source
        </Button>
      }
    >
      <div className="sources-list">
        {sources.length === 0 ? (
          <p className="sources-empty">No sources yet</p>
        ) : (
          sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isSelected={source.id === selectedSourceId}
              onClick={() => onSelectSource(source.id)}
              onDelete={
                onDeleteSource ? () => onDeleteSource(source.id) : undefined
              }
            />
          ))
        )}
      </div>
    </Panel>
  );
}
