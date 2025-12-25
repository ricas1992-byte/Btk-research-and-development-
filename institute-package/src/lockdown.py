"""Lockdown manager for the Institute system."""
import sqlite3
from typing import Tuple

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .db_init import DatabaseInitializer
    from .state_manager import StateManager
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from db_init import DatabaseInitializer
    from state_manager import StateManager


class LockdownManager:
    """Manages system lockdown and recovery."""

    def __init__(self, config: Config):
        """Initialize lockdown manager.

        Args:
            config: System configuration
        """
        self.config = config
        self.state_manager = StateManager(config)
        self.audit_logger = AuditLogger(config)
        self.db_initializer = DatabaseInitializer(config)

    def trigger_lockdown(self, reason: str):
        """Trigger system lockdown.

        Args:
            reason: Reason for lockdown
        """
        current_mode, _, _ = self.state_manager.get_mode()

        if current_mode == 'LOCKDOWN':
            raise ValueError("System is already in LOCKDOWN mode")

        # Set to lockdown mode
        self.state_manager.set_mode('LOCKDOWN', reason)

        self.audit_logger.log(
            'director',
            'lockdown_triggered',
            details=reason
        )

    def verify_recovery_conditions(self) -> Tuple[bool, list]:
        """Verify conditions for recovery from lockdown.

        Returns:
            Tuple of (can_recover, list_of_issues)
        """
        issues = []

        # Check current mode
        mode, _, _ = self.state_manager.get_mode()
        if mode != 'LOCKDOWN':
            issues.append(f"System is not in LOCKDOWN mode (current: {mode})")

        # Check all escalations are acknowledged or resolved
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM escalations WHERE state NOT IN ('ACKNOWLEDGED', 'RESOLVED', 'EXPIRED')"
        )
        unacked_count = cursor.fetchone()[0]
        conn.close()

        if unacked_count > 0:
            issues.append(f"{unacked_count} escalation(s) not acknowledged")

        # Check database integrity
        integrity_results = self.db_initializer.verify_all()
        for db_name, is_ok in integrity_results.items():
            if not is_ok:
                issues.append(f"Database integrity check failed: {db_name}.db")

        # Check audit log integrity
        if not self.audit_logger.verify_integrity():
            issues.append("Audit log integrity check failed")

        return len(issues) == 0, issues

    def confirm_recovery(self) -> bool:
        """Confirm recovery from lockdown.

        Returns:
            True if recovery successful

        Raises:
            ValueError: If recovery conditions not met
        """
        can_recover, issues = self.verify_recovery_conditions()

        if not can_recover:
            raise ValueError(f"Cannot recover: {', '.join(issues)}")

        # Transition to RECOVERY mode first
        self.state_manager.set_mode('RECOVERY', 'Director confirmed recovery')

        self.audit_logger.log(
            'director',
            'recovery_initiated'
        )

        # Then transition to NORMAL
        self.state_manager.set_mode('NORMAL', 'Recovery completed')

        self.audit_logger.log(
            'director',
            'recovery_completed'
        )

        return True

    def get_lockdown_status(self) -> dict:
        """Get lockdown status information.

        Returns:
            Dictionary with lockdown status details
        """
        mode, updated_at, reason = self.state_manager.get_mode()
        can_recover, issues = self.verify_recovery_conditions()

        # Get escalation counts
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            "SELECT state, COUNT(*) FROM escalations GROUP BY state"
        )
        escalation_counts = dict(cursor.fetchall())

        conn.close()

        return {
            'mode': mode,
            'updated_at': updated_at,
            'reason': reason,
            'can_recover': can_recover,
            'recovery_issues': issues,
            'escalation_counts': escalation_counts
        }
