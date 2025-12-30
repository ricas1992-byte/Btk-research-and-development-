-- ============================================
-- BTK Institute Database Schema
-- Version: 1.0 (matches Technical Spec v1.3)
-- ============================================

-- --------------------------------------------
-- User (exactly 1 record)
-- --------------------------------------------
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- --------------------------------------------
-- Document (exactly 1 per user)
-- --------------------------------------------
CREATE TABLE document (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  writing_phase TEXT NOT NULL DEFAULT 'NOTES'
    CHECK(writing_phase IN ('NOTES', 'DRAFTING'))
);

-- --------------------------------------------
-- Source (immutable content, seed-only)
-- --------------------------------------------
CREATE TABLE source (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  document_id TEXT NOT NULL REFERENCES document(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'TEXT'
    CHECK(source_type IN ('PDF', 'WEB', 'TEXT', 'OTHER')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_source_document ON source(document_id);

-- --------------------------------------------
-- Annotation (cascade delete with source)
-- --------------------------------------------
CREATE TABLE annotation (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id),
  text_selection TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  note_content TEXT,
  highlight_color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_to_notes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_annotation_source ON annotation(source_id);

-- --------------------------------------------
-- Note (source orphanable, max 300 chars)
-- --------------------------------------------
CREATE TABLE note (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  document_id TEXT NOT NULL REFERENCES document(id),
  content TEXT NOT NULL CHECK(length(content) <= 300),
  source_id TEXT REFERENCES source(id) ON DELETE SET NULL,
  annotation_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_locked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_note_document ON note(document_id);

-- --------------------------------------------
-- ClaudeOutput (append-only)
-- --------------------------------------------
CREATE TABLE claude_output (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  document_id TEXT NOT NULL REFERENCES document(id),
  action_type TEXT NOT NULL
    CHECK(action_type IN ('SUMMARIZE', 'DRAFT', 'REWRITE', 'CRITIQUE')),
  input_snapshot TEXT NOT NULL,
  output_content TEXT NOT NULL,
  status_tag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  disposition TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(disposition IN ('PENDING', 'COPIED', 'DISCARDED'))
);

CREATE INDEX idx_claude_output_document ON claude_output(document_id);

-- --------------------------------------------
-- AdminException (append-only status updates)
-- --------------------------------------------
CREATE TABLE admin_exception (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  exception_type TEXT NOT NULL
    CHECK(exception_type IN ('ENV', 'ACCESS', 'TOOL', 'DATA', 'BOUND')),
  severity TEXT NOT NULL DEFAULT 'ERROR'
    CHECK(severity IN ('WARNING', 'ERROR')),
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  resolution_action TEXT,
  resolved_at TEXT
);

-- --------------------------------------------
-- SystemStatus (one per function, overwritten)
-- --------------------------------------------
CREATE TABLE system_status (
  id TEXT PRIMARY KEY,
  function_code TEXT UNIQUE NOT NULL
    CHECK(function_code IN ('ENV', 'ACCESS', 'TOOL', 'DATA', 'BOUND')),
  status TEXT NOT NULL DEFAULT 'OK'
    CHECK(status IN ('OK', 'WARNING', 'ERROR')),
  last_check_at TEXT NOT NULL DEFAULT (datetime('now')),
  message TEXT
);

-- Initialize system status records
INSERT INTO system_status (id, function_code, status, last_check_at) VALUES
  ('ss-env', 'ENV', 'OK', datetime('now')),
  ('ss-access', 'ACCESS', 'OK', datetime('now')),
  ('ss-tool', 'TOOL', 'OK', datetime('now')),
  ('ss-data', 'DATA', 'OK', datetime('now')),
  ('ss-bound', 'BOUND', 'OK', datetime('now'));
