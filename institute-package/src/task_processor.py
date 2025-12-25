#!/usr/bin/env python3
"""Task processor for the Institute system."""
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .queue_manager import QueueManager
    from .state_manager import StateManager
    from .utils import acquire_lock, release_lock
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from queue_manager import QueueManager
    from state_manager import StateManager
    from utils import acquire_lock, release_lock


class TaskProcessor:
    """Processes research tasks from the queue."""

    def __init__(self, config: Config):
        """Initialize task processor.

        Args:
            config: System configuration
        """
        self.config = config
        self.state_manager = StateManager(config)
        self.queue_manager = QueueManager(config)
        self.audit_logger = AuditLogger(config)

    def update_heartbeat(self):
        """Update task processor heartbeat."""
        heartbeat_file = self.config.system_heartbeat_dir / "task_processor"
        heartbeat_file.parent.mkdir(parents=True, exist_ok=True)
        heartbeat_file.write_text(datetime.now().isoformat())

    def process_pending_tasks(self) -> int:
        """Process all pending tasks in the queue.

        Returns:
            Number of tasks processed
        """
        # Check if we can process tasks
        if not self.state_manager.can_process_tasks():
            mode, _, reason = self.state_manager.get_mode()
            self.audit_logger.log(
                'system',
                'task_processing_blocked',
                details=f"Mode: {mode}, Reason: {reason}"
            )
            return 0

        # Acquire lock to prevent concurrent processing
        if not acquire_lock(self.config.task_processor_lock):
            self.audit_logger.log('system', 'task_processor_lock_failed')
            return 0

        try:
            processed_count = 0

            # Get all pending task files
            pending_files = sorted(self.config.queues_research_pending.glob("*.json"))

            for task_file in pending_files:
                try:
                    # Read task data
                    with open(task_file, 'r') as f:
                        task_data = json.load(f)

                    task_id = task_data['id']

                    # Move to processing
                    self.queue_manager.move_task(task_id, 'pending', 'processing')
                    self.queue_manager.update_task_status(task_id, 'processing')

                    self.audit_logger.log(
                        'system',
                        'task_started',
                        target=f"task_{task_id}",
                        details=task_data.get('name')
                    )

                    # Process the task (placeholder - actual processing logic would go here)
                    success = self.execute_task(task_data)

                    # Move to completed or failed
                    if success:
                        self.queue_manager.move_task(task_id, 'processing', 'completed')
                        self.queue_manager.update_task_status(task_id, 'completed')
                        self.audit_logger.log(
                            'system',
                            'task_completed',
                            target=f"task_{task_id}"
                        )
                    else:
                        self.queue_manager.move_task(task_id, 'processing', 'failed')
                        self.queue_manager.update_task_status(
                            task_id,
                            'failed',
                            error_message='Task execution failed'
                        )
                        self.audit_logger.log(
                            'system',
                            'task_failed',
                            target=f"task_{task_id}"
                        )

                    processed_count += 1

                except Exception as e:
                    # Log error and continue
                    self.audit_logger.log(
                        'system',
                        'task_processing_error',
                        target=str(task_file),
                        details=str(e)
                    )

            # Update heartbeat
            self.update_heartbeat()

            return processed_count

        finally:
            # Always release lock
            release_lock(self.config.task_processor_lock)

    def execute_task(self, task_data: dict) -> bool:
        """Execute a task (placeholder for actual task logic).

        Args:
            task_data: Task data dictionary

        Returns:
            True if successful, False otherwise
        """
        # This is a placeholder. In a real implementation, this would:
        # 1. Execute task-specific logic based on task type
        # 2. Run analysis scripts
        # 3. Generate outputs
        # 4. Record findings in research.db

        # For now, just simulate successful execution
        return True


def main():
    """Main entry point for task processor."""
    # Parse command-line arguments
    base_path = None
    for arg in sys.argv[1:]:
        if arg.startswith('--base-path='):
            base_path = arg.split('=', 1)[1]

    # Initialize and run
    config = Config(base_path)
    processor = TaskProcessor(config)

    try:
        count = processor.process_pending_tasks()
        if count > 0:
            print(f"Processed {count} task(s)")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
