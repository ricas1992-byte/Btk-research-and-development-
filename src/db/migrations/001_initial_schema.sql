-- Migration 001: Initial Schema
-- Creates all CDW tables and indexes per Section 0.5.3

-- ============================================================================
-- PHASE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 500),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_hash TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_phase
  ON phase(status) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_phase_status
  ON phase(status);

-- ============================================================================
-- DECISION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS decision (
  id TEXT PRIMARY KEY NOT NULL,
  phase_id TEXT NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'LOCKED')) DEFAULT 'DRAFT',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  locked_at TEXT,
  content_hash TEXT NOT NULL,
  CHECK ((status = 'LOCKED' AND locked_at IS NOT NULL) OR (status = 'DRAFT' AND locked_at IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_decision_phase
  ON decision(phase_id);

CREATE INDEX IF NOT EXISTS idx_decision_status
  ON decision(status);

-- ============================================================================
-- TASK TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_task_decision
  ON task(decision_id);

CREATE INDEX IF NOT EXISTS idx_task_status
  ON task(status);

-- ============================================================================
-- DOCUMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document (
  id TEXT PRIMARY KEY NOT NULL,
  phase_id TEXT NOT NULL REFERENCES phase(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 500),
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_phase
  ON document(phase_id);

-- ============================================================================
-- PARKING LOT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS parking_lot (
  id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_phase_id TEXT REFERENCES phase(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_parking_lot_source
  ON parking_lot(source_phase_id);

CREATE INDEX IF NOT EXISTS idx_parking_lot_created
  ON parking_lot(created_at DESC);
