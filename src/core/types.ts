/**
 * Core Type Definitions for CDW
 * Section 0.5.3: Core Domain Entities
 *
 * All entities follow the immutability and hash verification protocol
 * per Section 0.5.5 (Hash Verification Protocol).
 */

// ============================================================================
// PHASE ENTITY
// ============================================================================

/**
 * Phase Status Values per Section 0.5.6
 */
export type PhaseStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

/**
 * Phase Entity
 *
 * Represents a single work phase promoted from the parking lot.
 * Constraint: Maximum one ACTIVE phase at any time (enforced in S3).
 *
 * State Transitions (Section 0.5.6):
 * [INITIAL] → ACTIVE
 * ACTIVE → COMPLETED
 * ACTIVE → ABANDONED
 * COMPLETED → (terminal)
 * ABANDONED → (terminal)
 */
export interface Phase {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  content_hash: string;
}

// ============================================================================
// DECISION ENTITY
// ============================================================================

/**
 * Decision Status Values per Section 0.5.6
 */
export type DecisionStatus = 'DRAFT' | 'LOCKED';

/**
 * Decision Entity
 *
 * Represents an immutable decision made within a phase.
 * Constraint: Content immutable after LOCKED status (enforced in S3).
 *
 * State Transitions (Section 0.5.6):
 * [INITIAL] → DRAFT
 * DRAFT → LOCKED
 * DRAFT → (deleted)
 * LOCKED → (terminal, immutable)
 */
export interface Decision {
  id: string;
  phase_id: string;
  content: string; // Plain text content (no formatting)
  status: DecisionStatus;
  created_at: string; // ISO 8601 timestamp
  locked_at: string | null; // ISO 8601 timestamp when locked
  content_hash: string;
}

// ============================================================================
// TASK ENTITY
// ============================================================================

/**
 * Task Status Values per Section 0.5.6
 */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Task Entity
 *
 * Represents executable work derived from a locked decision.
 * Constraint: Can only be created from a LOCKED decision (enforced in S3).
 *
 * State Transitions (Section 0.5.6):
 * [INITIAL] → PENDING
 * PENDING → IN_PROGRESS
 * PENDING → CANCELLED
 * IN_PROGRESS → COMPLETED
 * IN_PROGRESS → PENDING
 * IN_PROGRESS → CANCELLED
 * COMPLETED → (terminal)
 * CANCELLED → (terminal)
 */
export interface Task {
  id: string;
  decision_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  content_hash: string;
}

// ============================================================================
// DOCUMENT ENTITY
// ============================================================================

/**
 * Document Entity
 *
 * Plain text document attached to a phase.
 * Content type: Plain text only (no markdown, no rich text).
 *
 * Per Section 0.5.3:
 * - No formatting
 * - No rich text
 * - No markdown rendering
 */
export interface Document {
  id: string;
  phase_id: string;
  title: string;
  content: string; // Plain text only
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  content_hash: string;
}

// ============================================================================
// PARKING LOT ENTITY
// ============================================================================

/**
 * ParkingLot Entity
 *
 * Simple idea capture mechanism without disrupting active phase.
 *
 * Per Section 0.5.3:
 * - No status
 * - No workflow
 * - Simple capture only
 */
export interface ParkingLot {
  id: string;
  content: string;
  created_at: string; // ISO 8601 timestamp
  source_phase_id: string | null; // Optional reference to originating phase
}

// ============================================================================
// HASH VERIFICATION TYPES
// ============================================================================

/**
 * Hash computation result
 */
export interface HashResult {
  hash: string;
  algorithm: 'SHA-256';
  version: string;
}

/**
 * Hash verification result
 */
export interface VerificationResult {
  valid: boolean;
  expected: string;
  actual: string;
  message?: string;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Database configuration
 */
export interface DatabaseConfig {
  path: string;
  enableWAL: boolean;
  enableForeignKeys: boolean;
}

/**
 * Migration metadata
 */
export interface Migration {
  id: string;
  name: string;
  sql: string;
  applied_at?: string;
}
