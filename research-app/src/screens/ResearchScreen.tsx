// ============================================
// Research Screen - Complete Implementation
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { storage } from '@/utils/storage';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Header } from '@/components/layout/Header';
import { SourcesPanel } from '@/components/layout/SourcesPanel';
import { NotesPanel } from '@/components/layout/NotesPanel';
import { DraftView } from '@/components/research/DraftView';
import { SourceView } from '@/components/research/SourceView';
import { AIOutputArea } from '@/components/research/AIOutputArea';
import { ClaudeActionButtons } from '@/components/research/ClaudeActionButtons';
import type {
  Document,
  Source,
  Note,
  ClaudeActionType,
  DraftContext,
} from '@shared/types';
import '@/styles/screens/research.css';

export function ResearchScreen() {
  const navigate = useNavigate();
  const { formattedTime } = useSessionTimer();
  const { status: networkStatus } = useNetworkStatus();

  // Document state
  const [document, setDocument] = useState<Document | null>(null);
  const [draftContent, setDraftContent] = useState('');

  // Sources & Notes
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // UI state
  const [currentView, setCurrentView] = useState<'draft' | 'source'>('draft');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sourcesPanelCollapsed, setSourcesPanelCollapsed] = useState(
    storage.getSourcesPanelCollapsed()
  );
  const [notesPanelCollapsed, setNotesPanelCollapsed] = useState(
    storage.getNotesPanelCollapsed()
  );

  // Claude state
  const [claudeOutput, setClaudeOutput] = useState<{
    content: string;
    statusTag: string;
    outputId: string;
  } | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeEnabled] = useState(true); // Feature flag

  // Loading & errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-save
  const { saveError } = useAutoSave(draftContent, {
    onSave: async (content) => {
      if (document) {
        await api.updateDocument({ content });
      }
    },
  });

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docData, sourcesData, notesData] = await Promise.all([
        api.getDocument(),
        api.getSources(),
        api.getNotes(),
      ]);

      setDocument(docData);
      setDraftContent(docData.content);
      setSources(sourcesData);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/login');
  };

  const handleTitleChange = async (title: string) => {
    if (!document) return;
    try {
      const updated = await api.updateDocument({ title });
      setDocument(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update title');
    }
  };

  const handleToggleSourcesPanel = () => {
    setSourcesPanelCollapsed((prev) => {
      storage.setSourcesPanelCollapsed(!prev);
      return !prev;
    });
  };

  const handleToggleNotesPanel = () => {
    setNotesPanelCollapsed((prev) => {
      storage.setNotesPanelCollapsed(!prev);
      return !prev;
    });
  };

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setCurrentView('source');
  };

  const handleBackToDraft = () => {
    setCurrentView('draft');
    setSelectedSourceId(null);
  };

  const handleCreateNote = async (content: string) => {
    try {
      const note = await api.createNote({ content });
      setNotes((prev) => [note, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      const updated = await api.updateNote(noteId, { content });
      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? updated : note))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const handleClaudeAction = async (
    actionType: ClaudeActionType,
    context?: DraftContext
  ) => {
    if (actionType === 'READY') {
      try {
        const updated = await api.transitionPhase({ to_phase: 'DRAFTING' });
        setDocument(updated);
        const notesData = await api.getNotes();
        setNotes(notesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transition phase');
      }
      return;
    }

    setClaudeLoading(true);
    setError(null);

    try {
      const input =
        actionType === 'REWRITE' || actionType === 'CRITIQUE'
          ? draftContent
          : undefined;

      const response = await api.invokeClaude({
        action_type: actionType,
        input,
        context,
      });

      setClaudeOutput({
        content: response.output_content,
        statusTag: response.status_tag,
        outputId: response.output_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claude request failed');
    } finally {
      setClaudeLoading(false);
    }
  };

  const handleCopyToEditor = async () => {
    if (!claudeOutput) return;

    setDraftContent((prev) =>
      prev ? `${prev}\n\n${claudeOutput.content}` : claudeOutput.content
    );

    await api.updateClaudeDisposition({
      output_id: claudeOutput.outputId,
      disposition: 'COPIED',
    });

    setClaudeOutput(null);
  };

  const handleDiscardOutput = async () => {
    if (!claudeOutput) return;

    await api.updateClaudeDisposition({
      output_id: claudeOutput.outputId,
      disposition: 'DISCARDED',
    });

    setClaudeOutput(null);
  };

  if (loading) {
    return <div className="research-screen">Loading...</div>;
  }

  if (!document) {
    return <div className="research-screen">No document found</div>;
  }

  const selectedSource = sources.find((s) => s.id === selectedSourceId);

  return (
    <div className="research-screen">
      <Header
        documentTitle={document.title}
        onTitleChange={handleTitleChange}
        sessionTime={formattedTime}
        onLogout={handleLogout}
      />

      <div className="research-body">
        <SourcesPanel
          sources={sources}
          selectedSourceId={selectedSourceId}
          collapsed={sourcesPanelCollapsed}
          onToggleCollapse={handleToggleSourcesPanel}
          onSelectSource={handleSelectSource}
        />

        <div className="research-central">
          <div className="research-zone-2a">
            {currentView === 'draft' ? (
              <DraftView content={draftContent} onChange={setDraftContent} />
            ) : selectedSource ? (
              <SourceView source={selectedSource} onBack={handleBackToDraft} />
            ) : null}
          </div>

          {currentView === 'draft' && (
            <>
              <ClaudeActionButtons
                claudeEnabled={claudeEnabled}
                writingPhase={document.writing_phase}
                notesCount={notes.filter((n) => n.is_locked === 0).length}
                hasSummary={false}
                draftContent={draftContent}
                onAction={handleClaudeAction}
                loading={claudeLoading}
              />

              {claudeOutput && (
                <AIOutputArea
                  output={claudeOutput.content}
                  statusTag={claudeOutput.statusTag}
                  onCopy={handleCopyToEditor}
                  onDiscard={handleDiscardOutput}
                />
              )}
            </>
          )}
        </div>

        <NotesPanel
          notes={notes}
          collapsed={notesPanelCollapsed}
          onToggleCollapse={handleToggleNotesPanel}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      {networkStatus === 'offline' && (
        <div className="network-status-offline">Connection lost</div>
      )}
      {saveError && <div className="save-error">{saveError}</div>}
      {error && <div className="global-error">{error}</div>}
    </div>
  );
}
