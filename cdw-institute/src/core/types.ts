// Core type definitions for CDW Institute

// Epistemic status - only Table items can have 'binding' status
export type EpistemicStatus = 'provisional' | 'under-judgment' | 'binding';

// Zone identifiers
export type ZoneId = 'table' | 'side-desk' | 'reading-chair' | 'shelves';

// Base item that can exist in any zone
export interface WorkspaceItem {
  id: string;
  createdAt: Date;
  modifiedAt: Date;
  title: string;
  content: string;
  sourceReferences: string[];
  annotations: Annotation[];
  currentZone: ZoneId;
  epistemicStatus: EpistemicStatus;
  history: TransitionRecord[];
}

// Record of movement between zones
export interface TransitionRecord {
  timestamp: Date;
  fromZone: ZoneId | null;
  toZone: ZoneId;
  researcherNote: string; // Required - Researcher must state why
}

// Annotation - always provisional unless attached to Table Record
export interface Annotation {
  id: string;
  createdAt: Date;
  content: string;
  isProvisional: boolean; // Always true unless part of binding Table Record
}

// Table Record - the only binding artifact type
export interface TableRecord {
  id: string;
  createdAt: Date;
  finalizedAt: Date;
  verdict: string;
  reasoning: string;
  supportingItems: string[]; // IDs of items that were on Table during judgment
  isBinding: true; // Literal true - Table Records are always binding
}

// Zone capacity constraints
export interface ZoneConstraints {
  table: { maxItems: 5 };
  sideDesk: { maxItems: 20 };
  readingChair: { maxItems: null }; // Unlimited
  shelves: { maxItems: null }; // Unlimited
}

// Result type for operations that can fail
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
