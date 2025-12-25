"""Queue management for the Institute system."""
import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from .config import Config
    from .utils import ensure_parent_dir
except ImportError:
    from config import Config
    from utils import ensure_parent_dir


class QueueManager:
    """Manages task queues and transitions."""

    def __init__(self, config: Config):
        """Initialize queue manager.

        Args:
            config: System configuration
        """
        self.config = config

    def create_task(self, name: str, description: Optional[str] = None) -> int:
        """Create a new research task.

        Args:
            name: Task name
            description: Task description (optional)

        Returns:
            Task ID
        """
        # Insert into database
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (name, description, status) VALUES (?, ?, 'pending')",
            (name, description)
        )
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Create task file in pending queue
        task_file = self.config.queues_research_pending / f"{task_id}.json"
        task_data = {
            'id': task_id,
            'name': name,
            'description': description,
            'created_at': datetime.now().isoformat()
        }

        ensure_parent_dir(task_file)
        with open(task_file, 'w') as f:
            json.dump(task_data, f, indent=2)

        return task_id

    def get_task_status(self, task_id: int) -> Optional[dict]:
        """Get status of a task.

        Args:
            task_id: Task ID

        Returns:
            Dict with task details or None if not found
        """
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, description, status, created_at, updated_at, completed_at, error_message FROM tasks WHERE id = ?",
            (task_id,)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'status': row[3],
                'created_at': row[4],
                'updated_at': row[5],
                'completed_at': row[6],
                'error_message': row[7]
            }
        return None

    def list_tasks(self, status: Optional[str] = None) -> list:
        """List tasks, optionally filtered by status.

        Args:
            status: Filter by status (optional)

        Returns:
            List of task dictionaries
        """
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()

        if status:
            cursor.execute(
                "SELECT id, name, description, status, created_at, updated_at FROM tasks WHERE status = ? ORDER BY created_at DESC",
                (status,)
            )
        else:
            cursor.execute(
                "SELECT id, name, description, status, created_at, updated_at FROM tasks ORDER BY created_at DESC"
            )

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'status': row[3],
                'created_at': row[4],
                'updated_at': row[5]
            }
            for row in rows
        ]

    def update_task_status(self, task_id: int, status: str, error_message: Optional[str] = None):
        """Update task status in database.

        Args:
            task_id: Task ID
            status: New status
            error_message: Error message if status is 'failed'
        """
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()

        if status == 'completed':
            cursor.execute(
                "UPDATE tasks SET status = ?, updated_at = datetime('now'), completed_at = datetime('now') WHERE id = ?",
                (status, task_id)
            )
        elif status == 'failed':
            cursor.execute(
                "UPDATE tasks SET status = ?, updated_at = datetime('now'), error_message = ? WHERE id = ?",
                (status, error_message, task_id)
            )
        else:
            cursor.execute(
                "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
                (status, task_id)
            )

        conn.commit()
        conn.close()

    def move_task(self, task_id: int, from_status: str, to_status: str) -> bool:
        """Move task file between queue directories.

        Args:
            task_id: Task ID
            from_status: Current status (pending, processing, completed, failed)
            to_status: Target status

        Returns:
            True if successful, False otherwise
        """
        status_to_dir = {
            'pending': self.config.queues_research_pending,
            'processing': self.config.queues_research_processing,
            'completed': self.config.queues_research_completed,
            'failed': self.config.queues_research_failed
        }

        if from_status not in status_to_dir or to_status not in status_to_dir:
            return False

        source = status_to_dir[from_status] / f"{task_id}.json"
        dest = status_to_dir[to_status] / f"{task_id}.json"

        try:
            if source.exists():
                ensure_parent_dir(dest)
                source.rename(dest)
            return True
        except Exception:
            return False
