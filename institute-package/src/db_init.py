"""Database initialization for the Institute system."""
import sqlite3
from pathlib import Path
from typing import Optional

try:
    from .config import Config
except ImportError:
    from config import Config


class DatabaseInitializer:
    """Handles database initialization and schema setup."""

    def __init__(self, config: Config, schema_dir: Optional[Path] = None):
        """Initialize database initializer.

        Args:
            config: System configuration
            schema_dir: Path to schema files (default: relative to module)
        """
        self.config = config
        if schema_dir is None:
            # Default to ../schemas relative to this module
            module_dir = Path(__file__).parent
            self.schema_dir = module_dir.parent / "schemas"
        else:
            self.schema_dir = schema_dir

    def initialize_all(self):
        """Initialize all databases with their schemas."""
        databases = [
            (self.config.system_db, "system.sql"),
            (self.config.research_db, "research.sql"),
            (self.config.management_db, "management.sql"),
            (self.config.shared_db, "shared.sql"),
            (self.config.audit_db, "audit.sql"),
        ]

        for db_path, schema_file in databases:
            self.initialize_database(db_path, schema_file)

    def initialize_database(self, db_path: Path, schema_file: str):
        """Initialize a single database with its schema.

        Args:
            db_path: Path to database file
            schema_file: Name of schema SQL file
        """
        # Ensure db directory exists
        db_path.parent.mkdir(parents=True, exist_ok=True)

        # Read schema
        schema_path = self.schema_dir / schema_file
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")

        with open(schema_path, 'r') as f:
            schema_sql = f.read()

        # Execute schema
        conn = sqlite3.connect(str(db_path))
        try:
            conn.executescript(schema_sql)
            conn.commit()
        finally:
            conn.close()

    def verify_integrity(self, db_path: Path) -> bool:
        """Verify database integrity.

        Args:
            db_path: Path to database

        Returns:
            True if integrity check passes
        """
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()
            conn.close()
            return result[0] == 'ok'
        except Exception:
            return False

    def verify_all(self) -> dict:
        """Verify integrity of all databases.

        Returns:
            Dict mapping database name to integrity status
        """
        databases = {
            'system': self.config.system_db,
            'research': self.config.research_db,
            'management': self.config.management_db,
            'shared': self.config.shared_db,
            'audit': self.config.audit_db,
        }

        results = {}
        for name, db_path in databases.items():
            if db_path.exists():
                results[name] = self.verify_integrity(db_path)
            else:
                results[name] = False

        return results
