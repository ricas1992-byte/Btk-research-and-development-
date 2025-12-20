// Core entity types for CDW

export interface Project {
  id: 'singleton';
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = 'PARKED' | 'PROMOTED' | 'ABANDONED';

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  promotedAt: string | null;
  abandonedAt: string | null;
}

export type PhaseStatus = 'ACTIVE' | 'CLOSED';

export interface Phase {
  id: string;
  title: string;
  objective: string;
  status: PhaseStatus;
  sourceIdeaId: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Document {
  id: string;
  phaseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = 'DRAFT' | 'LOCKED';

export interface Decision {
  id: string;
  phaseId: string;
  title: string;
  statement: string;
  rationale: string;
  status: DecisionStatus;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
}

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'VOIDED';

export interface Task {
  id: string;
  decisionId: string;
  phaseId: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  voidedAt: string | null;
}

export interface DocumentSnapshot {
  id: string;
  phaseId: string;
  originalDocumentId: string;
  title: string;
  content: string;
  contentHash: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldState: string | null;
  newState: string | null;
  details: string | null;
  createdAt: string;
}

export interface UsedToken {
  token: string;
  action: string;
  usedAt: string;
}

// API response types
export interface BackupInfo {
  file: string;
  checksum: string;
  timestamp: string;
  size: number;
}

export interface ExportInfo {
  file: string;
  stats: {
    ideas: number;
    phases: number;
    decisions: number;
    tasks: number;
    documents: number;
    snapshots: number;
  };
}

export interface ClosePhaseTokenResponse {
  token: string;
}

export interface PromoteIdeaResponse {
  idea: Idea;
  phase: Phase;
}
