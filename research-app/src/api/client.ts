// ============================================
// API Client for BTK Institute v5.2
// NO AI INTEGRATION - Uses JWT tokens for auth
// ============================================

import type {
  LoginRequest,
  LoginResponse,
  Document,
  UpdateDocumentRequest,
  Source,
  Annotation,
  CreateAnnotationRequest,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  AdminException,
  SystemStatus,
  ApiResponse,
} from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    });

    const data = await response.json() as ApiResponse<T>;

    if (!response.ok || !data.success) {
      const errorMessage = data.error || 'An unexpected error occurred.';
      throw new Error(errorMessage);
    }

    return data.data as T;
  }

  // ==========================================
  // Auth
  // ==========================================

  async login(credentials: LoginRequest): Promise<void> {
    await this.request<LoginResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    await this.request('auth/logout', { method: 'POST' });
  }

  async getMe(): Promise<{ user: { id: string; username: string } }> {
    return this.request('auth/me');
  }

  // ==========================================
  // Document
  // ==========================================

  async getDocument(): Promise<Document> {
    const data = await this.request<any>('document');
    return {
      id: data.id,
      user_id: '',
      title: data.title,
      content: data.content,
      writing_phase: data.writingPhase,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };
  }

  async updateDocument(update: UpdateDocumentRequest): Promise<Document> {
    const data = await this.request<any>('document', {
      method: 'PUT',
      body: JSON.stringify(update),
    });
    return {
      id: data.id,
      user_id: '',
      title: data.title,
      content: data.content,
      writing_phase: data.writingPhase,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };
  }

  async transitionPhase(): Promise<Document> {
    const data = await this.request<any>('writing-phase/ready-to-write', {
      method: 'POST',
    });
    // Refresh document after phase transition
    return this.getDocument();
  }

  // ==========================================
  // Sources
  // ==========================================

  async getSources(): Promise<Source[]> {
    const sources = await this.request<any[]>('sources');
    return sources.map(s => ({
      id: s.id,
      user_id: '',
      document_id: '',
      title: s.title,
      content: '',
      source_type: s.sourceType,
      source_url: s.sourceUrl,
      created_at: s.createdAt,
    }));
  }

  async getSource(id: string): Promise<Source> {
    const s = await this.request<any>(`sources/${id}`);
    return {
      id: s.id,
      user_id: '',
      document_id: '',
      title: s.title,
      content: s.content,
      source_type: s.sourceType,
      source_url: s.sourceUrl,
      created_at: s.createdAt,
    };
  }

  // ==========================================
  // Annotations
  // ==========================================

  async getAnnotations(sourceId: string): Promise<Annotation[]> {
    const annotations = await this.request<any[]>(`sources/${sourceId}/annotations`);
    return annotations.map(a => ({
      id: a.id,
      source_id: a.sourceId,
      user_id: '',
      text_selection: a.textSelection,
      start_offset: a.startOffset,
      end_offset: a.endOffset,
      note_content: a.noteContent,
      highlight_color: a.highlightColor,
      created_at: a.createdAt,
      synced_to_notes: a.syncedToNotes ? 1 : 0,
    }));
  }

  async createAnnotation(sourceId: string, data: CreateAnnotationRequest): Promise<Annotation> {
    const a = await this.request<any>(`sources/${sourceId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: a.id,
      source_id: a.sourceId,
      user_id: '',
      text_selection: a.textSelection,
      start_offset: a.startOffset,
      end_offset: a.endOffset,
      note_content: a.noteContent,
      highlight_color: a.highlightColor,
      created_at: a.createdAt,
      synced_to_notes: a.syncedToNotes ? 1 : 0,
    };
  }

  async deleteAnnotation(id: string): Promise<void> {
    await this.request(`annotations/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // Notes
  // ==========================================

  async getNotes(): Promise<Note[]> {
    const notes = await this.request<any[]>('notes');
    return notes.map(n => ({
      id: n.id,
      user_id: '',
      document_id: '',
      content: n.content,
      source_id: n.sourceId,
      annotation_id: n.annotationId,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
      is_locked: n.isLocked ? 1 : 0,
    }));
  }

  async createNote(data: CreateNoteRequest): Promise<Note> {
    const n = await this.request<any>('notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: n.id,
      user_id: '',
      document_id: '',
      content: n.content,
      source_id: n.sourceId,
      annotation_id: n.annotationId,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
      is_locked: n.isLocked ? 1 : 0,
    };
  }

  async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
    const n = await this.request<any>(`notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return {
      id: n.id,
      user_id: '',
      document_id: '',
      content: n.content,
      source_id: n.sourceId,
      annotation_id: n.annotationId,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
      is_locked: n.isLocked ? 1 : 0,
    };
  }

  async deleteNote(id: string): Promise<void> {
    await this.request(`notes/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // Admin
  // ==========================================

  async getExceptions(): Promise<AdminException[]> {
    const exceptions = await this.request<any[]>('admin/exceptions');
    return exceptions.map(e => ({
      id: e.id,
      user_id: '',
      exception_type: e.exceptionType,
      severity: e.severity,
      description: e.description,
      impact: e.impact,
      detected_at: e.detectedAt,
      status: e.status,
      resolution_action: e.resolutionAction,
      resolved_at: e.resolvedAt,
    }));
  }

  async dismissException(id: string): Promise<void> {
    await this.request(`admin/exceptions/${id}/dismiss`, {
      method: 'POST',
    });
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    const statuses = await this.request<any[]>('admin/status');
    return statuses.map(s => ({
      id: '',
      function_code: s.functionCode,
      status: s.status,
      last_check_at: s.lastCheckAt,
      message: s.message,
    }));
  }
}

export const api = new APIClient();
