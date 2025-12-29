// ============================================
// API Client
// ============================================

import type {
  LoginRequest,
  LoginResponse,
  ValidateResponse,
  Document,
  UpdateDocumentRequest,
  TransitionPhaseRequest,
  ErrorResponse,
} from '@shared/types';

const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('btk_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('btk_token', token);
    } else {
      localStorage.removeItem('btk_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(error.error || 'An unexpected error occurred.');
    }

    return data as T;
  }

  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('auth-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('auth-logout', { method: 'POST' });
    this.setToken(null);
  }

  async validateToken(): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('auth-validate');
  }

  // Document
  async getDocument(): Promise<Document> {
    return this.request<Document>('document-get');
  }

  async updateDocument(data: UpdateDocumentRequest): Promise<Document> {
    return this.request<Document>('document-update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async transitionPhase(data: TransitionPhaseRequest): Promise<Document> {
    return this.request<Document>('document-phase', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Sources
  async getSources(): Promise<import('@shared/types').Source[]> {
    return this.request('sources-list');
  }

  async deleteSource(id: string): Promise<void> {
    await this.request(`sources-delete?id=${id}`, { method: 'DELETE' });
  }

  // Annotations
  async getAnnotations(sourceId: string): Promise<import('@shared/types').Annotation[]> {
    return this.request(`annotations-list?source_id=${sourceId}`);
  }

  async createAnnotation(data: import('@shared/types').CreateAnnotationRequest): Promise<import('@shared/types').Annotation> {
    return this.request('annotations-create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notes
  async getNotes(): Promise<import('@shared/types').Note[]> {
    return this.request('notes-list');
  }

  async createNote(data: import('@shared/types').CreateNoteRequest): Promise<import('@shared/types').Note> {
    return this.request('notes-create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: import('@shared/types').UpdateNoteRequest): Promise<import('@shared/types').Note> {
    return this.request(`notes-update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.request(`notes-delete?id=${id}`, { method: 'DELETE' });
  }

  // Claude
  async invokeClaude(data: import('@shared/types').InvokeClaudeRequest): Promise<import('@shared/types').InvokeClaudeResponse> {
    return this.request('claude-invoke', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClaudeDisposition(data: import('@shared/types').UpdateDispositionRequest): Promise<void> {
    await this.request('claude-disposition', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin
  async getExceptions(): Promise<import('@shared/types').AdminException[]> {
    return this.request('admin-exceptions');
  }

  async resolveException(data: import('@shared/types').ResolveExceptionRequest): Promise<void> {
    await this.request('admin-resolve', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getSystemStatus(): Promise<import('@shared/types').SystemStatus[]> {
    return this.request('admin-status');
  }
}

export const api = new APIClient();
