// ============================================
// Local Storage Utilities
// ============================================

const STORAGE_KEYS = {
  TOKEN: 'btk_token',
  SOURCES_PANEL_COLLAPSED: 'btk_sources_panel_collapsed',
  NOTES_PANEL_COLLAPSED: 'btk_notes_panel_collapsed',
  DRAFT_BACKUP: 'btk_draft_backup',
} as const;

export const storage = {
  // Token
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // Panel state
  getSourcesPanelCollapsed(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SOURCES_PANEL_COLLAPSED) === 'true';
  },

  setSourcesPanelCollapsed(collapsed: boolean): void {
    localStorage.setItem(
      STORAGE_KEYS.SOURCES_PANEL_COLLAPSED,
      String(collapsed)
    );
  },

  getNotesPanelCollapsed(): boolean {
    return localStorage.getItem(STORAGE_KEYS.NOTES_PANEL_COLLAPSED) === 'true';
  },

  setNotesPanelCollapsed(collapsed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.NOTES_PANEL_COLLAPSED, String(collapsed));
  },

  // Draft backup
  getDraftBackup(): string | null {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_BACKUP);
  },

  setDraftBackup(content: string): void {
    localStorage.setItem(STORAGE_KEYS.DRAFT_BACKUP, content);
  },

  removeDraftBackup(): void {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_BACKUP);
  },

  // Clear all
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
