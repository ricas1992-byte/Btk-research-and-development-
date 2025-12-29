// ============================================
// Research: AI Output Area (Zone 2b)
// ============================================

import React from 'react';
import { Button } from '@/components/common/Button';
import './AIOutputArea.css';

interface AIOutputAreaProps {
  output: string | null;
  statusTag: string;
  onCopy: () => void;
  onDiscard: () => void;
}

export function AIOutputArea({
  output,
  statusTag,
  onCopy,
  onDiscard,
}: AIOutputAreaProps) {
  if (!output) {
    return null;
  }

  return (
    <div className="ai-output-area">
      <div className="ai-output-header">
        <span className="ai-output-status">{statusTag}</span>
        <div className="ai-output-actions">
          <Button onClick={onCopy} variant="primary">
            Copy to Editor
          </Button>
          <Button onClick={onDiscard} variant="secondary">
            Discard
          </Button>
        </div>
      </div>
      <div className="ai-output-content">
        <pre>{output}</pre>
      </div>
    </div>
  );
}
