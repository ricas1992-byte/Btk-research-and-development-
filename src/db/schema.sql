-- CDW Database Schema
-- Section 0.5.3: Core Domain Entities
--
-- Database: SQLite 3.x
-- Foreign Keys: ENABLED
-- Journal Mode: WAL (Write-Ahead Logging)

-- ============================================================================
-- PHASE TABLE
-- ============================================================================
-- Section 0.5.3: Phase Entity
-- Constraint: Maximum one ACTIVE phase at any time (enforced via unique index)
--
-- Status values: ACTIVE, COMPLETED, ABANDONED
-- State transitions per Section 0.5.6

CREATE TABLE IF NOT EXISTS phase (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 500),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_hash TEXT NOT NULL
);

-- Unique constraint: Only one ACTIVE phase allowed at any time
-- This is a failsafe; primary enforcement is in S3 State Machine layer
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_phase
  ON phase(status) WHERE status = 'ACTIVE';

-- Index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_phase_status
  ON phase(status);

-- ============================================================================
-- DECISION TABLE
-- ============================================================================
-- Section 0.5.3: Decision Entity
-- Constraint: Content immutable after LOCKED status (enforced in S3)
--
-- Status values: DRAFT, LOCKED
-- State transitions per Section 0.5.6

CREATE TABLE IF NOT EXISTS decision (
  id TEXT PRIMARY KEY NOT NULL,
  phase_id TEXT NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'LOCKED')) DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  locked_at TEXT,
  content_hash TEXT NOT NULL,

  -- Constraint: locked_at must be set when status is LOCKED
  CHECK ((status = 'LOCKED' AND locked_at IS NOT NULL) OR (status = 'DRAFT' AND locked_at IS NULL))
);

-- Index for efficient phase_id queries
CREATE INDEX IF NOT EXISTS idx_decision_phase
  ON decision(phase_id);

-- Index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_decision_status
  ON decision(status);

-- ============================================================================
-- TASK TABLE
-- ============================================================================
-- Section 0.5.3: Task Entity
-- Constraint: Can only be created from a LOCKED decision (enforced in S3)
--
-- Status values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
-- State transitions per Section 0.5.6

CREATE TABLE IF NOT EXISTS task (
  id TEXT PRIMARY KEY NOT NULL,
  decision_id TEXT NOT NULL REFERENCES decision(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 500),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_hash TEXT NOT NULL
);

-- Index for efficient decision_id queries
CREATE INDEX IF NOT EXISTS idx_task_decision
  ON task(decision_id);

-- Index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_task_status
  ON task(status);

-- ============================================================================
-- DOCUMENT TABLE
-- ============================================================================
-- Section 0.5.3: Document Entity
-- Content type: Plain text only (no markdown, no rich text)

CREATE TABLE IF NOT EXISTS document (
  id TEXT PRIMARY KEY NOT NULL,
  phase_id TEXT NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 500),
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_hash TEXT NOT NULL
);

-- Index for efficient phase_id queries
CREATE INDEX IF NOT EXISTS idx_document_phase
  ON document(phase_id);

-- ============================================================================
-- PARKING LOT TABLE
-- ============================================================================
-- Section 0.5.3: ParkingLot Entity
-- Simple idea capture without disrupting active phase
-- No status, no workflow

CREATE TABLE IF NOT EXISTS parking_lot (
  id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_phase_id TEXT REFERENCES phase(id) ON DELETE SET NULL
);

-- Index for efficient source_phase_id queries
CREATE INDEX IF NOT EXISTS idx_parking_lot_source
  ON parking_lot(source_phase_id);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_parking_lot_created
  ON parking_lot(created_at DESC);

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. All tables use TEXT PRIMARY KEY for entity IDs (UUIDs as strings)
-- 2. Foreign key constraints with CASCADE/SET NULL for referential integrity
-- 3. CHECK constraints enforce valid status values per Section 0.5.6
-- 4. Unique index on phase.status='ACTIVE' enforces single active phase
-- 5. All timestamps are ISO 8601 format via SQLite datetime('now')
-- 6. All entities include content_hash for verification per Section 0.5.5
-- 7. Plain text content only - no formatting columns
--
-- Enforcement Strategy (Section 0.5.2):
-- - Database constraints are FAILSAFE layer
-- - Primary enforcement is in S3 State Machine & Enforcement Layer
-- - Database will block violations that bypass application layer
