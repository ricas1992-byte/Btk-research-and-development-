// ============================================
// Research: Claude Action Buttons
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import type { ClaudeActionType, DraftContext } from '@shared/types';
import './ClaudeActionButtons.css';

interface ClaudeActionButtonsProps {
  claudeEnabled: boolean;
  writingPhase: 'NOTES' | 'DRAFTING';
  notesCount: number;
  hasSummary: boolean;
  draftContent: string;
  onAction: (actionType: ClaudeActionType, context?: DraftContext) => void;
  loading: boolean;
}

export function ClaudeActionButtons({
  claudeEnabled,
  writingPhase,
  notesCount,
  hasSummary,
  draftContent,
  onAction,
  loading,
}: ClaudeActionButtonsProps) {
  const [showContextForm, setShowContextForm] = useState(false);
  const [context, setContext] = useState<DraftContext>({
    purpose: 'General',
    role: 'Researcher',
    tone: 'Academic',
  });

  if (!claudeEnabled) {
    return (
      <div className="claude-disabled">
        AI assistance is not configured.
      </div>
    );
  }

  const handleDraft = () => {
    setShowContextForm(true);
  };

  const handleSubmitDraft = () => {
    onAction('DRAFT', context);
    setShowContextForm(false);
  };

  if (showContextForm) {
    return (
      <div className="claude-context-form">
        <h3>Draft Context</h3>
        <div className="form-field">
          <label>Purpose</label>
          <select
            value={context.purpose}
            onChange={(e) => setContext({ ...context, purpose: e.target.value })}
          >
            <option>General</option>
            <option>Analysis</option>
            <option>Synthesis</option>
            <option>Argument</option>
          </select>
        </div>
        <div className="form-field">
          <label>Role</label>
          <select
            value={context.role}
            onChange={(e) => setContext({ ...context, role: e.target.value })}
          >
            <option>Researcher</option>
            <option>Student</option>
            <option>Practitioner</option>
            <option>Educator</option>
          </select>
        </div>
        <div className="form-field">
          <label>Tone</label>
          <select
            value={context.tone}
            onChange={(e) => setContext({ ...context, tone: e.target.value })}
          >
            <option>Academic</option>
            <option>Professional</option>
            <option>Conversational</option>
            <option>Formal</option>
          </select>
        </div>
        <div className="form-actions">
          <Button onClick={handleSubmitDraft}>Generate Draft</Button>
          <Button onClick={() => setShowContextForm(false)} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="claude-actions">
      <Button
        onClick={() => onAction('SUMMARIZE')}
        disabled={notesCount === 0 || loading}
        variant="secondary"
      >
        Summarize My Notes
      </Button>

      <Button
        onClick={() => onAction('READY')}
        disabled={!hasSummary || writingPhase === 'DRAFTING' || loading}
        variant="secondary"
      >
        Ready to Write
      </Button>

      <Button
        onClick={handleDraft}
        disabled={writingPhase !== 'DRAFTING' || loading}
        variant="secondary"
      >
        Prepare Draft
      </Button>

      <Button
        onClick={() => onAction('REWRITE', undefined)}
        disabled={!draftContent || loading}
        variant="secondary"
      >
        Rewrite for Clarity
      </Button>

      <Button
        onClick={() => onAction('CRITIQUE')}
        disabled={!draftContent || loading}
        variant="secondary"
      >
        Critique Logic
      </Button>
    </div>
  );
}
