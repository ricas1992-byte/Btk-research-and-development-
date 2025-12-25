-- Audit database schema
CREATE TABLE IF NOT EXISTS log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT,
    checksum TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_role ON log(role);
CREATE INDEX IF NOT EXISTS idx_audit_action ON log(action);
