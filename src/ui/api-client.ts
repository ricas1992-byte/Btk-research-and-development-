/**
 * API client for CDW frontend.
 * Handles all HTTP requests to the backend.
 */

const API_BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
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

  // Documents
  getDocuments: (phaseId?: string) =>
    request('GET', `/documents${phaseId ? `?phaseId=${phaseId}` : ''}`),
  createDocument: (phaseId: string, title: string, content: string) =>
    request('POST', '/documents', { phaseId, title, content }),
  updateDocument: (id: string, updates: { title?: string; content?: string }) =>
    request('PATCH', `/documents/${id}`, updates),
  deleteDocument: (id: string) => request('DELETE', `/documents/${id}`),

  // Decisions
  getDecisions: (phaseId?: string) =>
    request('GET', `/decisions${phaseId ? `?phaseId=${phaseId}` : ''}`),
  createDecision: (phaseId: string, title: string, statement: string, rationale: string) =>
    request('POST', '/decisions', { phaseId, title, statement, rationale }),
  updateDecision: (
    id: string,
    updates: { title?: string; statement?: string; rationale?: string }
  ) => request('PATCH', `/decisions/${id}`, updates),
  lockDecision: (id: string, confirmation: string) =>
    request('POST', `/decisions/${id}/lock`, { confirmation }),
  deleteDecision: (id: string) => request('DELETE', `/decisions/${id}`),

  // Tasks
  getTasks: (filters?: { phaseId?: string; decisionId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.phaseId) params.set('phaseId', filters.phaseId);
    if (filters?.decisionId) params.set('decisionId', filters.decisionId);
    const query = params.toString();
    return request('GET', `/tasks${query ? `?${query}` : ''}`);
  },
  createTask: (decisionId: string, title: string, description: string) =>
    request('POST', '/tasks', { decisionId, title, description }),
  completeTask: (id: string) => request('POST', `/tasks/${id}/complete`),
  voidTask: (id: string) => request('POST', `/tasks/${id}/void`),

  // Operations
  createBackup: () => request('POST', '/ops/backup'),
  listBackups: () => request('GET', '/ops/backups'),
  restore: (backupFile: string, confirmation: string) =>
    request('POST', '/ops/restore', { backupFile, confirmation }),
  export: () => request('POST', '/ops/export'),
  getAuditLog: (limit: number, offset: number) =>
    request('GET', `/ops/audit-log?limit=${limit}&offset=${offset}`),
};
