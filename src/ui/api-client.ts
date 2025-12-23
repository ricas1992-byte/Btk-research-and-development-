/**
 * API client for CDW frontend.
 * Handles all HTTP requests to the backend.
 * S4: Updated to handle enforcement errors (403) with rule codes.
 */

const API_BASE = '/api';

export interface EnforcementError {
  code: 'ENFORCEMENT_VIOLATION' | 'INVALID_STATE_TRANSITION';
  message: string;
  rule?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public enforcementError?: EnforcementError
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }));

    // Handle enforcement violations (403)
    if (response.status === 403 && errorData.error?.code === 'ENFORCEMENT_VIOLATION') {
      throw new ApiError(
        errorData.error.message,
        403,
        {
          code: 'ENFORCEMENT_VIOLATION',
          message: errorData.error.message,
          rule: errorData.error.rule,
        }
      );
    }

    // Handle state transition errors (400)
    if (response.status === 400 && errorData.error?.code === 'INVALID_STATE_TRANSITION') {
      throw new ApiError(
        errorData.error.message,
        400,
        {
          code: 'INVALID_STATE_TRANSITION',
          message: errorData.error.message,
        }
      );
    }

    throw new ApiError(
      errorData.error?.message || 'Request failed',
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Project
  getProject: () => request('GET', '/project'),
  updateProject: (name: string) => request('PATCH', '/project', { name }),

  // Ideas
  getIdeas: (status?: string) => request('GET', `/ideas${status ? `?status=${status}` : ''}`),
  createIdea: (title: string, description: string) =>
    request('POST', '/ideas', { title, description }),
  promoteIdea: (id: string) => request('POST', `/ideas/${id}/promote`),
  abandonIdea: (id: string) => request('POST', `/ideas/${id}/abandon`),

  // Phases
  getActivePhase: () => request('GET', '/phases/active'),
  getClosedPhases: () => request('GET', '/phases/closed'),
  getPhase: (id: string) => request('GET', `/phases/${id}`),
  requestCloseToken: (id: string) => request('POST', `/phases/${id}/close/token`),
  closePhase: (id: string, token: string, confirmation: string) =>
    request('POST', `/phases/${id}/close`, { token, confirmation }),
  getPhaseSnapshots: (id: string) => request('GET', `/phases/${id}/snapshots`),

  // Documents (S4: Updated to use phase_id)
  getDocuments: (phase_id?: string) =>
    request('GET', `/documents${phase_id ? `?phase_id=${phase_id}` : ''}`),
  createDocument: (phase_id: string, title: string, content: string) =>
    request('POST', '/documents', { phase_id, title, content }),
  updateDocument: (id: string, updates: { title?: string; content?: string }) =>
    request('PATCH', `/documents/${id}`, updates),
  deleteDocument: (id: string) => request('DELETE', `/documents/${id}`),

  // Decisions (S4: Updated to use phase_id and content field)
  getDecisions: (phase_id?: string) =>
    request('GET', `/decisions${phase_id ? `?phase_id=${phase_id}` : ''}`),
  createDecision: (phase_id: string, content: string) =>
    request('POST', '/decisions', { phase_id, content }),
  updateDecision: (id: string, content: string) =>
    request('PATCH', `/decisions/${id}`, { content }),
  lockDecision: (id: string) =>
    request('POST', `/decisions/${id}/lock`, {}),
  deleteDecision: (id: string) => request('DELETE', `/decisions/${id}`),

  // Tasks (S4: Updated to use decision_id and IN_PROGRESS workflow)
  getTasks: (filters?: { decision_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.decision_id) params.set('decision_id', filters.decision_id);
    const query = params.toString();
    return request('GET', `/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (decision_id: string, title: string, description: string) =>
    request('POST', '/tasks', { decision_id, title, description }),
  startTask: (id: string) => request('POST', `/tasks/${id}/start`),
  completeTask: (id: string) => request('POST', `/tasks/${id}/complete`),
  cancelTask: (id: string) => request('POST', `/tasks/${id}/cancel`),
  pauseTask: (id: string) => request('POST', `/tasks/${id}/pause`),

  // Operations
  createBackup: () => request('POST', '/ops/backup'),
  listBackups: () => request('GET', '/ops/backups'),
  restore: (backupFile: string, confirmation: string) =>
    request('POST', '/ops/restore', { backupFile, confirmation }),
  export: () => request('POST', '/ops/export'),
  getAuditLog: (limit: number, offset: number) =>
    request('GET', `/ops/audit-log?limit=${limit}&offset=${offset}`),
};
