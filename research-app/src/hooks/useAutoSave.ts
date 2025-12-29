// ============================================
// Hook: Auto-Save
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { CONFIG } from '@shared/config';

interface UseAutoSaveOptions {
  onSave: (content: string) => Promise<void>;
  intervalMs?: number;
}

export function useAutoSave(
  content: string,
  { onSave, intervalMs = CONFIG.AUTO_SAVE_INTERVAL_MS }: UseAutoSaveOptions
) {
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const contentRef = useRef(content);
  const pendingSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Track changes
  useEffect(() => {
    if (content !== contentRef.current) {
      setIsDirty(true);
      contentRef.current = content;
    }
  }, [content]);

  // Save function
  const save = useCallback(async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(contentRef.current);
      setIsDirty(false);
      setLastSaved(new Date());

      // Also save to localStorage as backup
      localStorage.setItem('btk_draft_backup', contentRef.current);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Save failed';
      setError(errorMessage);

      // Ensure localStorage backup even on error
      localStorage.setItem('btk_draft_backup', contentRef.current);
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, onSave]);

  // Auto-save interval
  useEffect(() => {
    if (pendingSaveRef.current) {
      clearInterval(pendingSaveRef.current);
    }

    pendingSaveRef.current = setInterval(() => {
      if (isDirty && !isSaving) {
        save();
      }
    }, intervalMs);

    return () => {
      if (pendingSaveRef.current) {
        clearInterval(pendingSaveRef.current);
      }
    };
  }, [isDirty, isSaving, intervalMs, save]);

  // Manual save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  return {
    isDirty,
    lastSaved,
    error,
    isSaving,
    saveNow: save,
  };
}
