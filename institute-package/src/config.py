"""Configuration management for the Institute system."""
import os
import sqlite3
from pathlib import Path
from typing import Optional


class Config:
    """Manages system configuration and paths."""

    def __init__(self, base_path: Optional[str] = None):
        """Initialize configuration.

        Args:
            base_path: Override base path for testing (default: /institute)
        """
        self.base_path = Path(base_path) if base_path else Path("/institute")

        # Core directories
        self.research_dir = self.base_path / "research"
        self.management_dir = self.base_path / "management"
        self.shared_dir = self.base_path / "shared"
        self.system_dir = self.base_path / "system"
        self.logs_dir = self.base_path / "logs"
        self.inbox_dir = self.base_path / "inbox"
        self.queues_dir = self.base_path / "queues"
        self.db_dir = self.base_path / "db"

        # Database paths
        self.system_db = self.db_dir / "system.db"
        self.research_db = self.db_dir / "research.db"
        self.management_db = self.db_dir / "management.db"
        self.shared_db = self.db_dir / "shared.db"
        self.audit_db = self.db_dir / "audit.db"

        # Specific subdirectories
        self.research_data_dir = self.research_dir / "data"
        self.research_scripts_dir = self.research_dir / "scripts"
        self.research_outputs_dir = self.research_dir / "outputs"

        self.management_config_dir = self.management_dir / "config"
        self.management_escalations_dir = self.management_dir / "escalations"

        self.shared_reports_dir = self.shared_dir / "reports"
        self.shared_templates_dir = self.shared_dir / "templates"

        self.system_bin_dir = self.system_dir / "bin"
        self.system_heartbeat_dir = self.system_dir / "heartbeat"
        self.system_alerts_dir = self.system_dir / "alerts"

        self.inbox_researcher_dir = self.inbox_dir / "researcher"
        self.inbox_director_dir = self.inbox_dir / "director"

        self.queues_research_dir = self.queues_dir / "research"
        self.queues_research_pending = self.queues_research_dir / "pending"
        self.queues_research_processing = self.queues_research_dir / "processing"
        self.queues_research_completed = self.queues_research_dir / "completed"
        self.queues_research_failed = self.queues_research_dir / "failed"

        self.queues_management_dir = self.queues_dir / "management"
        self.queues_management_pending = self.queues_management_dir / "pending"
        self.queues_management_escalations = self.queues_management_dir / "escalations"

        # Lock files
        self.task_processor_lock = self.system_dir / "task_processor.lock"

        # Current role (set by CLI)
        self.current_role: Optional[str] = None
        self.current_user: Optional[str] = None

    def ensure_directories(self):
        """Create all required directories if they don't exist."""
        directories = [
            self.research_dir,
            self.research_data_dir,
            self.research_scripts_dir,
            self.research_outputs_dir,
            self.management_dir,
            self.management_config_dir,
            self.management_escalations_dir,
            self.shared_dir,
            self.shared_reports_dir,
            self.shared_templates_dir,
            self.system_dir,
            self.system_bin_dir,
            self.system_heartbeat_dir,
            self.system_alerts_dir,
            self.logs_dir,
            self.inbox_dir,
            self.inbox_researcher_dir,
            self.inbox_director_dir,
            self.queues_dir,
            self.queues_research_dir,
            self.queues_research_pending,
            self.queues_research_processing,
            self.queues_research_completed,
            self.queues_research_failed,
            self.queues_management_dir,
            self.queues_management_pending,
            self.queues_management_escalations,
            self.db_dir,
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def get_config_value(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get a configuration value from management.db.

        Args:
            key: Configuration key
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        try:
            conn = sqlite3.connect(str(self.management_db))
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM config WHERE key = ?", (key,))
            row = cursor.fetchone()
            conn.close()
            return row[0] if row else default
        except Exception:
            return default

    def set_config_value(self, key: str, value: str):
        """Set a configuration value in management.db.

        Args:
            key: Configuration key
            value: Configuration value
        """
        conn = sqlite3.connect(str(self.management_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            (key, value)
        )
        conn.commit()
        conn.close()
