-- Shared database schema
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
    path TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_role TEXT NOT NULL CHECK(from_role IN ('system', 'researcher', 'director')),
    to_role TEXT NOT NULL CHECK(to_role IN ('researcher', 'director')),
    subject TEXT NOT NULL,
    content TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_role ON messages(to_role, read_at);
