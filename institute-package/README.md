# Institute Research Management System

A self-contained Linux system for managing research activities with autonomous operation, zero external dependencies, and strict role-based access control.

## Overview

The Institute system provides:
- **Two Roles**: Researcher (epistemic authority) and Director (management authority)
- **Zero External APIs**: Completely autonomous, no ongoing costs
- **Automatic Operation**: "No news is good news" — minimal notifications, maximum silence
- **Escalation System**: L1 → L2 → L3 → L4 → Automatic Lockdown
- **Lockdown Protection**: System self-protects when issues go unaddressed
- **Audit Trail**: Complete audit log with integrity checksums

## Quick Start

### Installation

As root:

```bash
cd institute-package
./bootstrap/install.sh
```

This will:
1. Create users: `researcher`, `director`, `institute-system`
2. Create `/institute` directory structure
3. Initialize databases
4. Install and start systemd services
5. Install CLI at `/usr/local/bin/institute`

### Verification

```bash
./bootstrap/verify.sh
```

Runs comprehensive tests to verify installation.

### Testing (Sandbox Mode)

Test without root privileges:

```bash
python3 test_sandbox.py
```

Creates a `./sandbox-institute` directory for testing.

## Usage

### Researcher Commands

```bash
# Create a research task
institute --role=researcher task create --name "Analyze data" --description "Run analysis on dataset"

# List tasks
institute --role=researcher task list
institute --role=researcher task list --status pending

# Check task status
institute --role=researcher task status <task-id>

# Check inbox
institute --role=researcher inbox list
institute --role=researcher inbox read <message-id>
```

### Director Commands

```bash
# Check system status
institute --role=director status

# Manage escalations
institute --role=director escalation list
institute --role=director escalation ack <escalation-id>
institute --role=director escalation resolve <escalation-id> --note "Resolution details"

# Generate reports
institute --role=director report generate daily
institute --role=director report generate weekly
institute --role=director report list

# View/update configuration
institute --role=director config show
institute --role=director config set disk_critical_threshold 95

# Lockdown management
institute --role=director lockdown trigger --reason "Security incident"
institute --role=director recovery verify
institute --role=director recovery confirm

# View audit log
institute --role=director audit tail
institute --role=director audit tail 100
```

## System Architecture

### Directory Structure

```
/institute/
├── research/           # Researcher only (rwx------)
│   ├── data/
│   ├── scripts/
│   └── outputs/
├── management/         # Director only (rwx------)
│   ├── config/
│   └── escalations/
├── shared/             # Both roles (rwxr-x---)
│   ├── reports/
│   └── templates/
├── system/             # System only (rwx------)
│   ├── bin/
│   ├── heartbeat/
│   └── alerts/
├── logs/               # Append-only (rwxr-xr-x)
├── inbox/
│   ├── researcher/
│   └── director/
├── queues/
│   ├── research/
│   │   ├── pending/
│   │   ├── processing/
│   │   ├── completed/
│   │   └── failed/
│   └── management/
│       ├── pending/
│       └── escalations/
└── db/
    ├── system.db
    ├── research.db
    ├── management.db
    ├── shared.db
    └── audit.db
```

### Components

#### Watchdog
- Runs every 60 seconds
- Monitors disk usage, heartbeats, database integrity
- Creates alert files when thresholds are exceeded
- Automatic health monitoring

#### Escalation Engine
- Processes alerts from watchdog
- Escalation levels: L1 → L2 → L3 → L4
- Each level waits 24 hours before escalating
- L4 triggers automatic lockdown after 7 days unacknowledged
- Sends notifications to Director inbox

#### Task Processor
- Runs every 15 minutes (timer-based)
- Processes tasks from research queue
- Updates task status and moves between queues
- Respects lockdown mode

#### Report Generator
- Daily reports at 06:00
- Weekly reports on Monday at 06:00
- Silent generation (file appears in `/institute/shared/reports/`)
- No notifications unless errors occur

#### Lockdown Manager
- System modes: NORMAL → ALERT → PRE-LOCKDOWN → LOCKDOWN → RECOVERY → NORMAL
- In LOCKDOWN:
  - Researcher CLI blocked
  - Task processing paused
  - Research database write-blocked
- Recovery requires:
  - All escalations acknowledged
  - Integrity checks pass
  - Director confirmation

### Databases

- **system.db**: System mode, heartbeats
- **research.db**: Tasks, hypotheses, findings
- **management.db**: Escalations, configuration
- **shared.db**: Reports, messages between roles
- **audit.db**: Complete audit trail with integrity checksums

## Role Enforcement

The system enforces strict role separation:

- **Researcher** can only execute research commands
- **Director** can only execute management commands
- Attempts to cross roles are logged in audit trail
- During LOCKDOWN, Researcher access is completely blocked

## Escalation System

### Levels

1. **L1 (Warning)**: Initial alert, 24-hour acknowledgment window
2. **L2 (Elevated)**: 48 hours unacknowledged
3. **L3 (Urgent)**: 72 hours unacknowledged
4. **L4 (Critical)**: 168 hours (7 days) unacknowledged → automatic lockdown

### Example Flow

```
Disk usage > 90%
    → Watchdog creates alert
    → Escalation Engine creates L1 escalation
    → Director inbox receives notification

If not acknowledged within 24 hours:
    → Escalates to L2
    → New notification sent

If not acknowledged within 48 hours:
    → Escalates to L3
    → Urgent notification sent

If not acknowledged within 72 hours:
    → Escalates to L4
    → Critical notification sent

If not acknowledged within 7 days total:
    → Automatic LOCKDOWN triggered
    → System enters protective mode
```

## Lockdown and Recovery

### Triggering Lockdown

Manual:
```bash
institute --role=director lockdown trigger --reason "Security incident"
```

Automatic:
- L4 escalation unacknowledged for 7 days
- Critical system integrity failure (if configured)

### Recovery Process

1. Check recovery conditions:
```bash
institute --role=director recovery verify
```

2. Address all issues:
```bash
institute --role=director escalation ack <id>
institute --role=director escalation resolve <id> --note "Fixed disk space"
```

3. Verify again:
```bash
institute --role=director recovery verify
```

4. Confirm recovery:
```bash
institute --role=director recovery confirm
```

System transitions: LOCKDOWN → RECOVERY → NORMAL

## Configuration

Default configuration in `management.db`:

```
escalation_l1_hours: 24
escalation_l2_hours: 48
escalation_l3_hours: 72
escalation_l4_hours: 168
disk_warning_threshold: 80
disk_critical_threshold: 90
heartbeat_stale_minutes: 30
auto_lockdown_enabled: true
```

Modify via:
```bash
institute --role=director config set <key> <value>
```

## Systemd Services

- `institute-watchdog.service` - Continuous health monitoring
- `institute-escalation.service` - Alert processing and escalation
- `institute-task-processor.timer` - Task queue processing (every 15 min)
- `institute-daily-report.timer` - Daily reports (06:00)
- `institute-weekly-report.timer` - Weekly reports (Mon 06:00)

Check status:
```bash
systemctl status institute-watchdog
systemctl status institute-escalation
```

View logs:
```bash
journalctl -u institute-watchdog -f
journalctl -u institute-escalation -f
```

## Audit Trail

Every action is logged with:
- Timestamp
- Role (researcher, director, system)
- Action performed
- Target of action
- Details
- SHA256 checksum for integrity

View recent audit log:
```bash
institute --role=director audit tail 50
```

Verify integrity:
```python
from audit_logger import AuditLogger
from config import Config

al = AuditLogger(Config())
print(al.verify_integrity())  # True if all checksums valid
```

## Testing

### Sandbox Testing

```bash
# Run all tests
python3 test_sandbox.py

# Or manually test with sandbox
institute --role=researcher --base-path=./sandbox-institute task create --name "Test"
institute --role=director --base-path=./sandbox-institute status
```

### Production Verification

```bash
# After installation
./bootstrap/verify.sh
```

Tests:
- User creation
- Directory structure
- Database initialization
- Service status
- CLI functionality
- Role enforcement
- Audit logging
- Watchdog operation
- Database integrity

## Development

### Package Structure

```
institute-package/
├── src/                    # Python modules
│   ├── cli.py             # Main CLI entry point
│   ├── config.py          # Configuration management
│   ├── state_manager.py   # System mode management
│   ├── audit_logger.py    # Audit trail
│   ├── task_processor.py  # Task queue processing
│   ├── queue_manager.py   # Queue operations
│   ├── watchdog.py        # Health monitoring
│   ├── escalation_engine.py  # Alert escalation
│   ├── report_generator.py   # Report generation
│   ├── lockdown.py        # Lockdown management
│   ├── db_init.py         # Database initialization
│   └── utils.py           # Utility functions
├── schemas/               # SQL database schemas
├── templates/             # Jinja2 report templates
├── systemd/               # Systemd unit files
├── bootstrap/             # Installation scripts
│   ├── install.sh
│   └── verify.sh
└── README.md
```

### Adding New Features

1. Update appropriate module in `src/`
2. Update database schema if needed in `schemas/`
3. Update CLI commands in `src/cli.py`
4. Add tests to `test_sandbox.py`
5. Update documentation

### Module Import Pattern

All modules support both relative and absolute imports for flexibility:

```python
try:
    from .config import Config
except ImportError:
    from config import Config
```

This allows modules to work both as a package and standalone.

## Security Considerations

- **User Separation**: Distinct Unix users for each role
- **Directory Permissions**: Strict rwx permissions per role
- **Role Enforcement**: CLI validates role before executing commands
- **Audit Trail**: All actions logged with checksums
- **Lockdown Protection**: System self-protects from unaddressed issues
- **No Network**: Zero external dependencies, air-gap capable
- **Database Integrity**: Regular PRAGMA integrity_check

## Troubleshooting

### Service Not Starting

```bash
# Check service status
systemctl status institute-watchdog
systemctl status institute-escalation

# View logs
journalctl -u institute-watchdog -n 50
journalctl -u institute-escalation -n 50

# Restart services
systemctl restart institute-watchdog
systemctl restart institute-escalation
```

### Permission Denied

Ensure you're using the correct role:
```bash
# This will fail
institute --role=researcher status

# This will succeed
institute --role=director status
```

### Database Locked

If SQLite database is locked:
```bash
# Check for stale locks
lsof /institute/db/*.db

# Restart services if needed
systemctl restart institute-task-processor.timer
```

### Stuck in Lockdown

```bash
# Check what's blocking recovery
institute --role=director recovery verify

# Acknowledge all escalations
institute --role=director escalation list
institute --role=director escalation ack <id>

# Resolve issues
institute --role=director escalation resolve <id> --note "Fixed"

# Confirm recovery
institute --role=director recovery confirm
```

## License

Internal research use only.

## Support

For issues or questions, check the audit log first:
```bash
institute --role=director audit tail 100
```

System is designed for autonomous operation. "No news is good news."
