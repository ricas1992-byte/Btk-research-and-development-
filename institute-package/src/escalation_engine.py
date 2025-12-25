#!/usr/bin/env python3
"""Escalation engine for the Institute system."""
import json
import sqlite3
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .state_manager import StateManager
    from .utils import ensure_parent_dir
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from state_manager import StateManager
    from utils import ensure_parent_dir


class EscalationEngine:
    """Manages alert escalation and notifications."""

    ESCALATION_LEVELS = ['L1', 'L2', 'L3', 'L4']
    LEVEL_TO_HOURS = {
        'L1': 24,
        'L2': 48,
        'L3': 72,
        'L4': 168  # 7 days
    }

    def __init__(self, config: Config):
        """Initialize escalation engine.

        Args:
            config: System configuration
        """
        self.config = config
        self.state_manager = StateManager(config)
        self.audit_logger = AuditLogger(config)

    def process_alert_files(self):
        """Process new alert files from watchdog."""
        alert_files = list(self.config.system_alerts_dir.glob("*.json"))

        for alert_file in alert_files:
            try:
                with open(alert_file, 'r') as f:
                    alert_data = json.load(f)

                # Create or update escalation
                self.create_escalation(
                    code=alert_data['code'],
                    message=alert_data['message'],
                    initial_level=alert_data.get('level', 'WARNING')
                )

                # Remove processed alert file
                alert_file.unlink()

            except Exception as e:
                self.audit_logger.log(
                    'system',
                    'escalation_processing_error',
                    target=str(alert_file),
                    details=str(e)
                )

    def create_escalation(self, code: str, message: str, initial_level: str = 'WARNING'):
        """Create a new escalation or update existing.

        Args:
            code: Escalation code (unique identifier)
            message: Escalation message
            initial_level: Initial severity level
        """
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        # Check if escalation already exists
        cursor.execute("SELECT id, level, state FROM escalations WHERE code = ?", (code,))
        existing = cursor.fetchone()

        if existing:
            # Update existing escalation if not already resolved
            esc_id, level, state = existing
            if state not in ('ACKNOWLEDGED', 'RESOLVED'):
                cursor.execute(
                    "UPDATE escalations SET message = ? WHERE id = ?",
                    (message, esc_id)
                )
        else:
            # Create new escalation at L1
            cursor.execute(
                """INSERT INTO escalations (code, level, state, message, created_at)
                   VALUES (?, 'L1', 'DETECTED', ?, datetime('now'))""",
                (code, message)
            )
            esc_id = cursor.lastrowid

            # Send notification to director
            self.send_notification(esc_id, 'L1', message)

            cursor.execute(
                "UPDATE escalations SET state = 'NOTIFIED', notified_at = datetime('now') WHERE id = ?",
                (esc_id,)
            )

        conn.commit()
        conn.close()

        self.audit_logger.log(
            'system',
            'escalation_created',
            target=code,
            details=message
        )

    def check_escalations(self):
        """Check all escalations and escalate if needed."""
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        # Get all active escalations (not resolved)
        cursor.execute(
            """SELECT id, code, level, state, message, created_at, notified_at, reminded_at
               FROM escalations
               WHERE state NOT IN ('RESOLVED', 'EXPIRED')"""
        )

        for row in cursor.fetchall():
            esc_id, code, level, state, message, created_at, notified_at, reminded_at = row

            try:
                self.process_escalation(
                    esc_id, code, level, state, message,
                    created_at, notified_at, reminded_at
                )
            except Exception as e:
                self.audit_logger.log(
                    'system',
                    'escalation_check_error',
                    target=code,
                    details=str(e)
                )

        conn.close()

    def process_escalation(self, esc_id: int, code: str, level: str, state: str,
                          message: str, created_at: str, notified_at: str,
                          reminded_at: str):
        """Process a single escalation and escalate if needed.

        Args:
            esc_id: Escalation ID
            code: Escalation code
            level: Current level
            state: Current state
            message: Escalation message
            created_at: Creation timestamp
            notified_at: Last notification timestamp
            reminded_at: Last reminder timestamp
        """
        now = datetime.now()

        # Determine time since last action
        if state == 'NOTIFIED' or state == 'REMINDED':
            last_action_str = reminded_at if reminded_at else notified_at
            last_action = datetime.fromisoformat(last_action_str)
            hours_since = (now - last_action).total_seconds() / 3600

            # Get escalation threshold for current level
            threshold = self.LEVEL_TO_HOURS.get(level, 24)

            if hours_since >= threshold:
                # Escalate to next level
                current_idx = self.ESCALATION_LEVELS.index(level)

                if current_idx < len(self.ESCALATION_LEVELS) - 1:
                    # Escalate to next level
                    next_level = self.ESCALATION_LEVELS[current_idx + 1]
                    self.escalate_to_level(esc_id, code, next_level, message)
                else:
                    # Already at L4, trigger lockdown if configured
                    if level == 'L4':
                        self.trigger_lockdown_from_escalation(code, message)

    def escalate_to_level(self, esc_id: int, code: str, level: str, message: str):
        """Escalate to a higher level.

        Args:
            esc_id: Escalation ID
            code: Escalation code
            level: New escalation level
            message: Escalation message
        """
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            """UPDATE escalations
               SET level = ?, state = 'NOTIFIED', notified_at = datetime('now')
               WHERE id = ?""",
            (level, esc_id)
        )
        conn.commit()
        conn.close()

        # Send notification
        self.send_notification(esc_id, level, message)

        self.audit_logger.log(
            'system',
            'escalation_escalated',
            target=code,
            details=f"Escalated to {level}"
        )

    def send_notification(self, esc_id: int, level: str, message: str):
        """Send notification to director inbox.

        Args:
            esc_id: Escalation ID
            level: Escalation level
            message: Message content
        """
        # Create message in director inbox
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        inbox_file = self.config.inbox_director_dir / f"escalation_{esc_id}_{timestamp}.txt"

        content = f"""ESCALATION ALERT - {level}

Escalation ID: {esc_id}
Level: {level}
Time: {datetime.now().isoformat()}

Message:
{message}

To acknowledge: institute --role=director escalation ack {esc_id}
To resolve: institute --role=director escalation resolve {esc_id} --note "resolution details"
"""

        ensure_parent_dir(inbox_file)
        inbox_file.write_text(content)

    def trigger_lockdown_from_escalation(self, code: str, message: str):
        """Trigger automatic lockdown from L4 escalation.

        Args:
            code: Escalation code
            message: Escalation message
        """
        # Check if auto-lockdown is enabled
        auto_lockdown = self.config.get_config_value('auto_lockdown_enabled', 'true')

        if auto_lockdown.lower() != 'true':
            return

        # Check current mode
        if not self.state_manager.is_lockdown():
            self.state_manager.set_mode(
                'LOCKDOWN',
                f'Automatic lockdown triggered by L4 escalation: {code}'
            )

            self.audit_logger.log(
                'system',
                'lockdown_triggered',
                target=code,
                details=message
            )

            # Notify director
            self.send_lockdown_notification(code, message)

    def send_lockdown_notification(self, code: str, message: str):
        """Send lockdown notification to director.

        Args:
            code: Escalation code that triggered lockdown
            message: Escalation message
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        inbox_file = self.config.inbox_director_dir / f"LOCKDOWN_{timestamp}.txt"

        content = f"""SYSTEM LOCKDOWN TRIGGERED

Time: {datetime.now().isoformat()}
Trigger: {code}

Message:
{message}

The system has entered LOCKDOWN mode due to unacknowledged L4 escalation.

To recover:
1. institute --role=director escalation list
2. institute --role=director escalation ack <id> (for all escalations)
3. institute --role=director recovery verify
4. institute --role=director recovery confirm
"""

        ensure_parent_dir(inbox_file)
        inbox_file.write_text(content)

    def run(self, interval_seconds: int = 60):
        """Run escalation engine continuously.

        Args:
            interval_seconds: Check interval in seconds
        """
        print(f"Escalation engine starting (interval: {interval_seconds}s)")
        self.audit_logger.log('system', 'escalation_engine_started')

        try:
            while True:
                try:
                    # Process new alerts
                    self.process_alert_files()

                    # Check existing escalations
                    self.check_escalations()

                except Exception as e:
                    self.audit_logger.log(
                        'system',
                        'escalation_engine_error',
                        details=str(e)
                    )
                    print(f"Error in escalation engine: {e}", file=sys.stderr)

                time.sleep(interval_seconds)

        except KeyboardInterrupt:
            print("\nEscalation engine stopping")
            self.audit_logger.log('system', 'escalation_engine_stopped')


def main():
    """Main entry point for escalation engine."""
    # Parse command-line arguments
    base_path = None
    interval = 60

    for arg in sys.argv[1:]:
        if arg.startswith('--base-path='):
            base_path = arg.split('=', 1)[1]
        elif arg.startswith('--interval='):
            interval = int(arg.split('=', 1)[1])

    # Initialize and run
    config = Config(base_path)
    engine = EscalationEngine(config)

    try:
        engine.run(interval)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
