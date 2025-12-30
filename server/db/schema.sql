-- ============================================
-- BTK Institute Database Schema v5.2
-- NO AI INTEGRATION
-- ============================================

-- --------------------------------------------
-- User (exactly 1 record)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- --------------------------------------------
-- Session (HTTP-only cookie auth)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expires_at);

-- --------------------------------------------
-- Document (exactly 1 per user)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS document (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  writing_phase TEXT NOT NULL DEFAULT 'NOTES'
    CHECK(writing_phase IN ('NOTES', 'DRAFTING'))
);

-- --------------------------------------------
-- Source (immutable content)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS source (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'TEXT'
    CHECK(source_type IN ('PDF', 'WEB', 'TEXT', 'OTHER')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_source_document ON source(document_id);
CREATE INDEX IF NOT EXISTS idx_source_user ON source(user_id);

-- --------------------------------------------
-- Annotation (cascade delete with source)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS annotation (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  text_selection TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  note_content TEXT,
  highlight_color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_to_notes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_annotation_source ON annotation(source_id);
CREATE INDEX IF NOT EXISTS idx_annotation_user ON annotation(user_id);

-- --------------------------------------------
-- Note (max 300 chars, point-based format)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS note (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK(length(content) <= 300),
  source_id TEXT REFERENCES source(id) ON DELETE SET NULL,
  annotation_id TEXT REFERENCES annotation(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_locked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_note_document ON note(document_id);
CREATE INDEX IF NOT EXISTS idx_note_user ON note(user_id);

-- --------------------------------------------
-- AdminException (append-only status updates)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS admin_exception (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_exception_user ON admin_exception(user_id);
CREATE INDEX IF NOT EXISTS idx_exception_status ON admin_exception(status);

-- --------------------------------------------
-- SystemStatus (one per function)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS system_status (
  id TEXT PRIMARY KEY,
  function_code TEXT UNIQUE NOT NULL
    CHECK(function_code IN ('ENV', 'ACCESS', 'TOOL', 'DATA', 'BOUND')),
  status TEXT NOT NULL DEFAULT 'OK'
    CHECK(status IN ('OK', 'WARNING', 'ERROR')),
  last_check_at TEXT NOT NULL DEFAULT (datetime('now')),
  message TEXT
);
