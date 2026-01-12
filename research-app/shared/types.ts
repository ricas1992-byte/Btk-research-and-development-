// ============================================
// Shared TypeScript Types
// Used by both frontend and backend
// ============================================

// --------------------------------------------
// Database Entity Types
// --------------------------------------------

export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  writing_phase: 'NOTES' | 'DRAFTING';
}

export type SourceType = 'PDF' | 'WEB' | 'TEXT' | 'OTHER';

export interface Source {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  content: string;
  source_type: SourceType;
  source_url: string | null;
  created_at: string;
}

export interface Annotation {
  id: string;
  source_id: string;
  user_id: string;
  text_selection: string;
  start_offset: number;
  end_offset: number;
  note_content: string | null;
  highlight_color: string | null;
  created_at: string;
  synced_to_notes: number; // SQLite boolean (0 or 1)
}

export interface Note {
  id: string;
  user_id: string;
  document_id: string;
  content: string; // max 300 chars
  source_id: string | null;
  annotation_id: string | null;
  created_at: string;
  updated_at: string;
  is_locked: number; // SQLite boolean (0 or 1)
}

// AI functionality is EXCLUDED from v5.2
// AI buttons are UI placeholders only - no backend integration

export type ExceptionType = 'ENV' | 'ACCESS' | 'TOOL' | 'DATA' | 'BOUND';
export type ExceptionSeverity = 'WARNING' | 'ERROR';
export type ExceptionStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface AdminException {
  id: string;
  user_id: string;
  exception_type: ExceptionType;
  severity: ExceptionSeverity;
  description: string;
  impact: string;
  detected_at: string;
  status: ExceptionStatus;
  resolution_action: string | null;
  resolved_at: string | null;
}

export type SystemStatusValue = 'OK' | 'WARNING' | 'ERROR';
export type FunctionCode = 'ENV' | 'ACCESS' | 'TOOL' | 'DATA' | 'BOUND';

export interface SystemStatus {
  id: string;
  function_code: FunctionCode;
  status: SystemStatusValue;
  last_check_at: string;
  message: string | null;
}

// --------------------------------------------
// API Request/Response Types
// --------------------------------------------

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
}

export interface MeResponse {
  user: {
    id: string;
    username: string;
  };
}

export interface TokenPayload {
  user_id: string;
  username: string;
  issued_at: number;
  expires_at: number;
  session_id: string;
}

export interface ValidateResponse {
  valid: boolean;
  user_id: string;
}

// Document
export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
}

// Annotations
export interface CreateAnnotationRequest {
  sourceId: string;
  textSelection: string;
  startOffset: number;
  endOffset: number;
  noteContent?: string;
  highlightColor?: string;
}

// Notes
export interface CreateNoteRequest {
  content: string;
  sourceId?: string;
}

export interface UpdateNoteRequest {
  content: string;
}

// Admin
export interface ResolveExceptionRequest {
  exception_id: string;
  action: 'DISMISS';
}

// Phase transitions
export interface TransitionPhaseRequest {
  to_phase: 'DRAFTING';
}

// Claude AI types
export type ClaudeActionType = 'SUMMARIZE' | 'DRAFT' | 'REWRITE' | 'CRITIQUE';

export interface DraftContext {
  purpose?: string;
  role?: string;
  tone?: string;
}

export interface InvokeClaudeRequest {
  action_type: ClaudeActionType;
  input?: string;
  context?: DraftContext;
}

export interface InvokeClaudeResponse {
  output_id: string;
  output_content: string;
  status_tag: string;
}

export interface UpdateDispositionRequest {
  output_id: string;
  disposition: 'COPIED' | 'DISCARDED';
}

// --------------------------------------------
// Standard API Response Types
// --------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

// --------------------------------------------
// Frontend State Types
// --------------------------------------------

export interface AuthState {
  userId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
}

export interface DocumentState {
  document: Document | null;
  isDirty: boolean;
  lastSaved: Date | null;
  saveError: string | null;
}

export interface SourcesState {
  sources: Source[];
  selectedSourceId: string | null;
  annotations: Record<string, Annotation[]>; // keyed by source_id
}

export interface NotesState {
  notes: Note[];
}

export interface UIState {
  currentView: 'draft' | 'source';
  sourcesPanelCollapsed: boolean;
  notesPanelCollapsed: boolean;
  sessionStartTime: Date | null;
  showLongSessionReminder: boolean;
  networkStatus: 'online' | 'offline';
}

export interface AdminState {
  exceptions: AdminException[];
  systemStatus: SystemStatus[];
  loading: boolean;
  error: string | null;
}
