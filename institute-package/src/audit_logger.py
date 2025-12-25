"""Audit logging for the Institute system."""
import sqlite3
from datetime import datetime
from typing import Optional

try:
    from .config import Config
    from .utils import compute_checksum
except ImportError:
    from config import Config
    from utils import compute_checksum


class AuditLogger:
    """Handles append-only audit logging."""

    def __init__(self, config: Config):
        """Initialize audit logger.

        Args:
            config: System configuration
        """
        self.config = config

    def log(self, role: str, action: str, target: Optional[str] = None, details: Optional[str] = None):
        """Write an audit log entry.

        Args:
            role: Role performing the action (researcher, director, system)
            action: Action being performed
            target: Target of the action (optional)
            details: Additional details (optional)
        """
        timestamp = datetime.now().isoformat()

        # Compute checksum of entry
        checksum_data = f"{timestamp}|{role}|{action}|{target or ''}|{details or ''}"
        checksum = compute_checksum(checksum_data)

        # Write to audit log
        conn = sqlite3.connect(str(self.config.audit_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO log (timestamp, role, action, target, details, checksum) VALUES (?, ?, ?, ?, ?, ?)",
            (timestamp, role, action, target, details, checksum)
        )
        conn.commit()
        conn.close()

    def get_recent_logs(self, limit: int = 50) -> list:
        """Get recent audit log entries.

        Args:
            limit: Maximum number of entries to return

        Returns:
            List of audit log entries as tuples
        """
        conn = sqlite3.connect(str(self.config.audit_db))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT timestamp, role, action, target, details FROM log ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()
        return rows

    def verify_integrity(self) -> bool:
        """Verify integrity of all audit log entries.

        Returns:
            True if all checksums are valid
        """
        conn = sqlite3.connect(str(self.config.audit_db))
        cursor = conn.cursor()
        cursor.execute("SELECT timestamp, role, action, target, details, checksum FROM log")

        for row in cursor.fetchall():
            timestamp, role, action, target, details, stored_checksum = row
            checksum_data = f"{timestamp}|{role}|{action}|{target or ''}|{details or ''}"
            computed_checksum = compute_checksum(checksum_data)

            if computed_checksum != stored_checksum:
                conn.close()
                return False

        conn.close()
        return True
