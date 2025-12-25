-- System database schema
CREATE TABLE IF NOT EXISTS system_mode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL CHECK(mode IN ('NORMAL', 'ALERT', 'PRE-LOCKDOWN', 'LOCKDOWN', 'RECOVERY')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    reason TEXT
);

-- Initialize with NORMAL mode
INSERT INTO system_mode (mode, reason)
SELECT 'NORMAL', 'System initialized'
WHERE NOT EXISTS (SELECT 1 FROM system_mode);

CREATE TABLE IF NOT EXISTS heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT NOT NULL UNIQUE,
    last_beat TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT DEFAULT 'OK'
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_component ON heartbeats(component);
CREATE INDEX IF NOT EXISTS idx_system_mode_updated ON system_mode(updated_at DESC);
