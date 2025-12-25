-- Management database schema
CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL CHECK(level IN ('L1', 'L2', 'L3', 'L4')),
    state TEXT NOT NULL DEFAULT 'DETECTED' CHECK(state IN ('DETECTED', 'NOTIFIED', 'REMINDED', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED')),
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    notified_at TEXT,
    reminded_at TEXT,
    acknowledged_at TEXT,
    resolved_at TEXT,
    resolution_note TEXT
);

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default configuration
INSERT OR IGNORE INTO config (key, value) VALUES
    ('escalation_l1_hours', '24'),
    ('escalation_l2_hours', '48'),
    ('escalation_l3_hours', '72'),
    ('escalation_l4_hours', '168'),
    ('disk_warning_threshold', '80'),
    ('disk_critical_threshold', '90'),
    ('heartbeat_stale_minutes', '30'),
    ('auto_lockdown_enabled', 'true');

CREATE INDEX IF NOT EXISTS idx_escalations_state ON escalations(state);
CREATE INDEX IF NOT EXISTS idx_escalations_created ON escalations(created_at DESC);
