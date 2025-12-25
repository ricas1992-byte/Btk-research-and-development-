"""System state management for the Institute system."""
import sqlite3
from datetime import datetime
from typing import Optional, Tuple

try:
    from .config import Config
except ImportError:
    from config import Config


class StateManager:
    """Manages system operational mode."""

    VALID_MODES = {'NORMAL', 'ALERT', 'PRE-LOCKDOWN', 'LOCKDOWN', 'RECOVERY'}

    def __init__(self, config: Config):
        """Initialize state manager.

        Args:
            config: System configuration
        """
        self.config = config

    def get_mode(self) -> Tuple[str, Optional[str], Optional[str]]:
        """Get current system mode.

        Returns:
            Tuple of (mode, updated_at, reason)
        """
        conn = sqlite3.connect(str(self.config.system_db))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT mode, updated_at, reason FROM system_mode ORDER BY id DESC LIMIT 1"
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return row[0], row[1], row[2]
        else:
            # Should never happen due to initialization, but handle gracefully
            return 'NORMAL', datetime.now().isoformat(), 'Default'

    def set_mode(self, mode: str, reason: str):
        """Set system mode.

        Args:
            mode: New system mode (must be in VALID_MODES)
            reason: Reason for mode change

        Raises:
            ValueError: If mode is invalid
        """
        if mode not in self.VALID_MODES:
            raise ValueError(f"Invalid mode: {mode}. Must be one of {self.VALID_MODES}")

        conn = sqlite3.connect(str(self.config.system_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO system_mode (mode, reason) VALUES (?, ?)",
            (mode, reason)
        )
        conn.commit()
        conn.close()

    def is_lockdown(self) -> bool:
        """Check if system is in lockdown mode.

        Returns:
            True if in LOCKDOWN mode
        """
        mode, _, _ = self.get_mode()
        return mode == 'LOCKDOWN'

    def is_normal(self) -> bool:
        """Check if system is in normal mode.

        Returns:
            True if in NORMAL mode
        """
        mode, _, _ = self.get_mode()
        return mode == 'NORMAL'

    def can_process_tasks(self) -> bool:
        """Check if tasks can be processed in current mode.

        Returns:
            True if tasks can be processed
        """
        mode, _, _ = self.get_mode()
        return mode not in {'LOCKDOWN', 'PRE-LOCKDOWN'}

    def can_researcher_access(self) -> bool:
        """Check if researcher can access system in current mode.

        Returns:
            True if researcher access is allowed
        """
        mode, _, _ = self.get_mode()
        return mode != 'LOCKDOWN'
