-- Migration 002: Audit Log Table
-- S3: State Machine & Enforcement Layer
-- Creates audit_log table for tracking all state transitions and enforcement actions

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
-- Immutable append-only log of all entity state changes
-- No updates or deletes allowed - audit trail must be complete

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Phase', 'Decision', 'Task', 'Document', 'ParkingLot')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT,
  metadata TEXT, -- JSON string for additional context
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for efficient entity lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log(entity_type, entity_id);

-- Index for efficient action queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON audit_log(action);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log(created_at DESC);
