#!/usr/bin/env python3
"""Watchdog daemon for the Institute system."""
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .db_init import DatabaseInitializer
    from .state_manager import StateManager
    from .utils import get_disk_usage, get_file_age_minutes
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from db_init import DatabaseInitializer
    from state_manager import StateManager
    from utils import get_disk_usage, get_file_age_minutes


class Watchdog:
    """System watchdog that monitors health and creates alerts."""

    def __init__(self, config: Config):
        """Initialize watchdog.

        Args:
            config: System configuration
        """
        self.config = config
        self.state_manager = StateManager(config)
        self.audit_logger = AuditLogger(config)
        self.db_initializer = DatabaseInitializer(config)

    def update_heartbeat(self):
        """Update watchdog heartbeat in system.db."""
        conn = sqlite3.connect(str(self.config.system_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO heartbeats (component, last_beat, status) VALUES (?, datetime('now'), 'OK')",
            ('watchdog',)
        )
        conn.commit()
        conn.close()

    def check_disk_usage(self) -> list:
        """Check disk usage and create alerts if needed.

        Returns:
            List of alert messages
        """
        alerts = []
        usage = get_disk_usage(self.config.base_path)

        warning_threshold = float(self.config.get_config_value('disk_warning_threshold', '80'))
        critical_threshold = float(self.config.get_config_value('disk_critical_threshold', '90'))

        if usage >= critical_threshold:
            alerts.append({
                'level': 'CRITICAL',
                'code': 'DISK_CRITICAL',
                'message': f'Disk usage at {usage:.1f}% (critical threshold: {critical_threshold}%)'
            })
        elif usage >= warning_threshold:
            alerts.append({
                'level': 'WARNING',
                'code': 'DISK_WARNING',
                'message': f'Disk usage at {usage:.1f}% (warning threshold: {warning_threshold}%)'
            })

        return alerts

    def check_heartbeats(self) -> list:
        """Check heartbeat file ages and create alerts if stale.

        Returns:
            List of alert messages
        """
        alerts = []
        stale_threshold = float(self.config.get_config_value('heartbeat_stale_minutes', '30'))

        # Check task processor heartbeat
        task_processor_heartbeat = self.config.system_heartbeat_dir / "task_processor"
        if task_processor_heartbeat.exists():
            age = get_file_age_minutes(task_processor_heartbeat)
            if age > stale_threshold:
                alerts.append({
                    'level': 'WARNING',
                    'code': 'HEARTBEAT_STALE_TASK_PROCESSOR',
                    'message': f'Task processor heartbeat is {age:.1f} minutes old'
                })

        return alerts

    def check_database_integrity(self) -> list:
        """Check integrity of all databases.

        Returns:
            List of alert messages
        """
        alerts = []
        results = self.db_initializer.verify_all()

        for db_name, is_ok in results.items():
            if not is_ok:
                alerts.append({
                    'level': 'CRITICAL',
                    'code': f'DB_INTEGRITY_{db_name.upper()}',
                    'message': f'Database integrity check failed: {db_name}.db'
                })

        return alerts

    def create_alert_file(self, alert: dict):
        """Create an alert file for the escalation engine.

        Args:
            alert: Alert dictionary with level, code, and message
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        alert_file = self.config.system_alerts_dir / f"{alert['code']}_{timestamp}.json"

        import json
        with open(alert_file, 'w') as f:
            json.dump({
                'level': alert['level'],
                'code': alert['code'],
                'message': alert['message'],
                'created_at': datetime.now().isoformat()
            }, f, indent=2)

        self.audit_logger.log(
            'system',
            'alert_created',
            target=alert['code'],
            details=alert['message']
        )

    def check_all(self):
        """Perform all health checks and create alerts."""
        all_alerts = []

        # Run all checks
        all_alerts.extend(self.check_disk_usage())
        all_alerts.extend(self.check_heartbeats())
        all_alerts.extend(self.check_database_integrity())

        # Create alert files
        for alert in all_alerts:
            self.create_alert_file(alert)

            # Auto-lockdown on critical alerts if enabled
            if alert['level'] == 'CRITICAL':
                auto_lockdown = self.config.get_config_value('auto_lockdown_enabled', 'true')
                if auto_lockdown.lower() == 'true':
                    # Don't trigger immediate lockdown, let escalation engine handle it
                    pass

        # Update our own heartbeat
        self.update_heartbeat()

    def run(self, interval_seconds: int = 60):
        """Run watchdog continuously.

        Args:
            interval_seconds: Check interval in seconds
        """
        print(f"Watchdog starting (interval: {interval_seconds}s)")
        self.audit_logger.log('system', 'watchdog_started')

        try:
            while True:
                try:
                    self.check_all()
                except Exception as e:
                    self.audit_logger.log(
                        'system',
                        'watchdog_error',
                        details=str(e)
                    )
                    print(f"Error during watchdog check: {e}", file=sys.stderr)

                time.sleep(interval_seconds)

        except KeyboardInterrupt:
            print("\nWatchdog stopping")
            self.audit_logger.log('system', 'watchdog_stopped')


def main():
    """Main entry point for watchdog."""
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
    watchdog = Watchdog(config)

    try:
        watchdog.run(interval)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
