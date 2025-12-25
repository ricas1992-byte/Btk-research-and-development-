#!/usr/bin/env python3
"""Command-line interface for the Institute system."""
import argparse
import sqlite3
import sys
from pathlib import Path

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .lockdown import LockdownManager
    from .queue_manager import QueueManager
    from .report_generator import ReportGenerator
    from .state_manager import StateManager
    from .utils import get_current_user
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from lockdown import LockdownManager
    from queue_manager import QueueManager
    from report_generator import ReportGenerator
    from state_manager import StateManager
    from utils import get_current_user


class InstituteCLI:
    """Command-line interface for the Institute system."""

    def __init__(self, role: str, base_path: str = None):
        """Initialize CLI.

        Args:
            role: User role (researcher or director)
            base_path: Override base path for testing
        """
        self.role = role
        self.config = Config(base_path)
        self.config.current_role = role
        self.config.current_user = get_current_user()

        self.state_manager = StateManager(self.config)
        self.audit_logger = AuditLogger(self.config)
        self.queue_manager = QueueManager(self.config)
        self.lockdown_manager = LockdownManager(self.config)
        self.report_generator = ReportGenerator(self.config)

    def enforce_role(self, required_role: str):
        """Enforce role-based access control.

        Args:
            required_role: Required role for this operation

        Raises:
            PermissionError: If current role doesn't match
        """
        if self.role != required_role:
            self.audit_logger.log(
                self.role,
                'role_violation',
                target=required_role,
                details=f"Attempted to execute {required_role} command"
            )
            raise PermissionError(
                f"Permission denied: This command requires '{required_role}' role. "
                f"You are logged in as '{self.role}'."
            )

    def check_lockdown(self):
        """Check if researcher access is blocked due to lockdown.

        Raises:
            RuntimeError: If in lockdown mode and user is researcher
        """
        if self.role == 'researcher':
            if not self.state_manager.can_researcher_access():
                mode, _, reason = self.state_manager.get_mode()
                self.audit_logger.log(
                    self.role,
                    'lockdown_access_denied',
                    details=f"Mode: {mode}, Reason: {reason}"
                )
                raise RuntimeError(
                    f"System is in {mode} mode. Researcher access is blocked.\n"
                    f"Reason: {reason}\n"
                    f"Contact the Director for recovery."
                )

    # RESEARCHER COMMANDS

    def task_create(self, args):
        """Create a new research task."""
        self.enforce_role('researcher')
        self.check_lockdown()

        task_id = self.queue_manager.create_task(args.name, args.description)

        self.audit_logger.log(
            self.role,
            'task_created',
            target=f"task_{task_id}",
            details=args.name
        )

        print(f"Task created: {task_id}")
        print(f"Name: {args.name}")
        if args.description:
            print(f"Description: {args.description}")

    def task_list(self, args):
        """List research tasks."""
        self.enforce_role('researcher')
        self.check_lockdown()

        tasks = self.queue_manager.list_tasks(args.status)

        if not tasks:
            print("No tasks found.")
            return

        print(f"{'ID':<6} {'Status':<12} {'Created':<20} {'Name'}")
        print("-" * 80)

        for task in tasks:
            print(f"{task['id']:<6} {task['status']:<12} {task['created_at'][:19]:<20} {task['name']}")

    def task_status(self, args):
        """Show task status."""
        self.enforce_role('researcher')
        self.check_lockdown()

        task = self.queue_manager.get_task_status(args.task_id)

        if not task:
            print(f"Task not found: {args.task_id}")
            return

        print(f"Task ID: {task['id']}")
        print(f"Name: {task['name']}")
        if task['description']:
            print(f"Description: {task['description']}")
        print(f"Status: {task['status']}")
        print(f"Created: {task['created_at']}")
        print(f"Updated: {task['updated_at']}")
        if task['completed_at']:
            print(f"Completed: {task['completed_at']}")
        if task['error_message']:
            print(f"Error: {task['error_message']}")

    def inbox_list(self, args):
        """List inbox messages."""
        self.enforce_role('researcher')
        self.check_lockdown()

        inbox_dir = self.config.inbox_researcher_dir
        messages = sorted(inbox_dir.glob("*"))

        if not messages:
            print("Inbox is empty.")
            return

        print("Inbox messages:")
        for i, msg_file in enumerate(messages, 1):
            print(f"{i}. {msg_file.name}")

    def inbox_read(self, args):
        """Read an inbox message."""
        self.enforce_role('researcher')
        self.check_lockdown()

        inbox_dir = self.config.inbox_researcher_dir
        messages = sorted(inbox_dir.glob("*"))

        try:
            msg_index = int(args.message_id) - 1
            if msg_index < 0 or msg_index >= len(messages):
                print(f"Invalid message ID: {args.message_id}")
                return

            msg_file = messages[msg_index]
            content = msg_file.read_text()
            print(content)

        except ValueError:
            print(f"Invalid message ID: {args.message_id}")

    # DIRECTOR COMMANDS

    def status(self, args):
        """Show system status."""
        self.enforce_role('director')

        status = self.lockdown_manager.get_lockdown_status()

        print(f"System Mode: {status['mode']}")
        print(f"Last Updated: {status['updated_at']}")
        if status['reason']:
            print(f"Reason: {status['reason']}")
        print()

        print("Escalations:")
        for state, count in status['escalation_counts'].items():
            print(f"  {state}: {count}")
        print()

        if status['mode'] == 'LOCKDOWN':
            print("Recovery Status:")
            if status['can_recover']:
                print("  ✓ System can be recovered")
            else:
                print("  ✗ Recovery blocked by:")
                for issue in status['recovery_issues']:
                    print(f"    - {issue}")

    def escalation_list(self, args):
        """List escalations."""
        self.enforce_role('director')

        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            """SELECT id, code, level, state, message, created_at, acknowledged_at
               FROM escalations
               ORDER BY created_at DESC"""
        )

        rows = cursor.fetchall()
        conn.close()

        if not rows:
            print("No escalations.")
            return

        print(f"{'ID':<6} {'Code':<30} {'Level':<6} {'State':<15} {'Created'}")
        print("-" * 100)

        for row in rows:
            esc_id, code, level, state, message, created_at, acked_at = row
            print(f"{esc_id:<6} {code:<30} {level:<6} {state:<15} {created_at[:19]}")

    def escalation_ack(self, args):
        """Acknowledge an escalation."""
        self.enforce_role('director')

        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE escalations SET state = 'ACKNOWLEDGED', acknowledged_at = datetime('now') WHERE id = ?",
            (args.escalation_id,)
        )

        if cursor.rowcount == 0:
            conn.close()
            print(f"Escalation not found: {args.escalation_id}")
            return

        conn.commit()
        conn.close()

        self.audit_logger.log(
            self.role,
            'escalation_acknowledged',
            target=f"escalation_{args.escalation_id}"
        )

        print(f"Escalation {args.escalation_id} acknowledged.")

    def escalation_resolve(self, args):
        """Resolve an escalation."""
        self.enforce_role('director')

        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            """UPDATE escalations
               SET state = 'RESOLVED', resolved_at = datetime('now'), resolution_note = ?
               WHERE id = ?""",
            (args.note, args.escalation_id)
        )

        if cursor.rowcount == 0:
            conn.close()
            print(f"Escalation not found: {args.escalation_id}")
            return

        conn.commit()
        conn.close()

        self.audit_logger.log(
            self.role,
            'escalation_resolved',
            target=f"escalation_{args.escalation_id}",
            details=args.note
        )

        print(f"Escalation {args.escalation_id} resolved.")

    def report_generate(self, args):
        """Generate a report."""
        self.enforce_role('director')

        if args.report_type == 'daily':
            report_file = self.report_generator.generate_daily_report()
        elif args.report_type == 'weekly':
            report_file = self.report_generator.generate_weekly_report()
        else:
            print(f"Invalid report type: {args.report_type}")
            return

        print(f"Report generated: {report_file}")

    def report_list(self, args):
        """List generated reports."""
        self.enforce_role('director')

        reports = self.report_generator.list_reports()

        if not reports:
            print("No reports found.")
            return

        print(f"{'ID':<6} {'Type':<10} {'Generated':<20} {'Path'}")
        print("-" * 100)

        for report in reports[:20]:  # Show last 20
            print(f"{report['id']:<6} {report['type']:<10} {report['generated_at'][:19]:<20} {report['path']}")

    def config_show(self, args):
        """Show configuration."""
        self.enforce_role('director')

        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()
        cursor.execute("SELECT key, value, updated_at FROM config ORDER BY key")
        rows = cursor.fetchall()
        conn.close()

        print(f"{'Key':<35} {'Value':<20} {'Updated'}")
        print("-" * 80)

        for key, value, updated_at in rows:
            print(f"{key:<35} {value:<20} {updated_at[:19]}")

    def config_set(self, args):
        """Set configuration value."""
        self.enforce_role('director')

        self.config.set_config_value(args.key, args.value)

        self.audit_logger.log(
            self.role,
            'config_updated',
            target=args.key,
            details=args.value
        )

        print(f"Configuration updated: {args.key} = {args.value}")

    def recovery_verify(self, args):
        """Verify recovery conditions."""
        self.enforce_role('director')

        can_recover, issues = self.lockdown_manager.verify_recovery_conditions()

        if can_recover:
            print("✓ All recovery conditions met.")
            print("Run 'institute --role=director recovery confirm' to complete recovery.")
        else:
            print("✗ Recovery blocked by:")
            for issue in issues:
                print(f"  - {issue}")

    def recovery_confirm(self, args):
        """Confirm recovery from lockdown."""
        self.enforce_role('director')

        try:
            self.lockdown_manager.confirm_recovery()
            print("✓ Recovery completed. System returned to NORMAL mode.")
        except ValueError as e:
            print(f"✗ Recovery failed: {e}")
            sys.exit(1)

    def lockdown_trigger(self, args):
        """Trigger system lockdown."""
        self.enforce_role('director')

        try:
            self.lockdown_manager.trigger_lockdown(args.reason)
            print(f"✓ System lockdown triggered.")
            print(f"Reason: {args.reason}")
        except ValueError as e:
            print(f"✗ Failed to trigger lockdown: {e}")
            sys.exit(1)

    def audit_tail(self, args):
        """Show recent audit log entries."""
        self.enforce_role('director')

        limit = args.n if args.n else 50
        logs = self.audit_logger.get_recent_logs(limit)

        print(f"{'Timestamp':<20} {'Role':<12} {'Action':<25} {'Target':<20} {'Details'}")
        print("-" * 120)

        for log in logs:
            timestamp, role, action, target, details = log
            target_str = target[:20] if target else ""
            details_str = details[:40] if details else ""
            print(f"{timestamp[:19]:<20} {role:<12} {action:<25} {target_str:<20} {details_str}")


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description='Institute Research Management System',
        prog='institute'
    )

    parser.add_argument(
        '--role',
        required=True,
        choices=['researcher', 'director'],
        help='User role'
    )

    parser.add_argument(
        '--base-path',
        help='Override base path (for testing)'
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')

    # RESEARCHER COMMANDS

    # task create
    task_create_parser = subparsers.add_parser('task', help='Task management')
    task_subparsers = task_create_parser.add_subparsers(dest='task_command')

    create_parser = task_subparsers.add_parser('create', help='Create a task')
    create_parser.add_argument('--name', required=True, help='Task name')
    create_parser.add_argument('--description', help='Task description')

    list_parser = task_subparsers.add_parser('list', help='List tasks')
    list_parser.add_argument('--status', choices=['pending', 'processing', 'completed', 'failed'], help='Filter by status')

    status_parser = task_subparsers.add_parser('status', help='Show task status')
    status_parser.add_argument('task_id', type=int, help='Task ID')

    # inbox
    inbox_parser = subparsers.add_parser('inbox', help='Inbox management')
    inbox_subparsers = inbox_parser.add_subparsers(dest='inbox_command')

    inbox_subparsers.add_parser('list', help='List inbox messages')

    read_parser = inbox_subparsers.add_parser('read', help='Read a message')
    read_parser.add_argument('message_id', help='Message ID')

    # DIRECTOR COMMANDS

    # status
    subparsers.add_parser('status', help='Show system status')

    # escalation
    escalation_parser = subparsers.add_parser('escalation', help='Escalation management')
    escalation_subparsers = escalation_parser.add_subparsers(dest='escalation_command')

    escalation_subparsers.add_parser('list', help='List escalations')

    ack_parser = escalation_subparsers.add_parser('ack', help='Acknowledge escalation')
    ack_parser.add_argument('escalation_id', type=int, help='Escalation ID')

    resolve_parser = escalation_subparsers.add_parser('resolve', help='Resolve escalation')
    resolve_parser.add_argument('escalation_id', type=int, help='Escalation ID')
    resolve_parser.add_argument('--note', required=True, help='Resolution note')

    # report
    report_parser = subparsers.add_parser('report', help='Report management')
    report_subparsers = report_parser.add_subparsers(dest='report_command')

    generate_parser = report_subparsers.add_parser('generate', help='Generate a report')
    generate_parser.add_argument('report_type', choices=['daily', 'weekly'], help='Report type')

    report_subparsers.add_parser('list', help='List reports')

    # config
    config_parser = subparsers.add_parser('config', help='Configuration management')
    config_subparsers = config_parser.add_subparsers(dest='config_command')

    config_subparsers.add_parser('show', help='Show configuration')

    set_parser = config_subparsers.add_parser('set', help='Set configuration value')
    set_parser.add_argument('key', help='Configuration key')
    set_parser.add_argument('value', help='Configuration value')

    # recovery
    recovery_parser = subparsers.add_parser('recovery', help='Recovery management')
    recovery_subparsers = recovery_parser.add_subparsers(dest='recovery_command')

    recovery_subparsers.add_parser('verify', help='Verify recovery conditions')
    recovery_subparsers.add_parser('confirm', help='Confirm recovery')

    # lockdown
    lockdown_parser = subparsers.add_parser('lockdown', help='Lockdown management')
    lockdown_subparsers = lockdown_parser.add_subparsers(dest='lockdown_command')

    trigger_parser = lockdown_subparsers.add_parser('trigger', help='Trigger lockdown')
    trigger_parser.add_argument('--reason', required=True, help='Lockdown reason')

    # audit
    audit_parser = subparsers.add_parser('audit', help='Audit log management')
    audit_subparsers = audit_parser.add_subparsers(dest='audit_command')

    tail_parser = audit_subparsers.add_parser('tail', help='Show recent audit log entries')
    tail_parser.add_argument('n', type=int, nargs='?', help='Number of entries')

    # Parse arguments
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Initialize CLI
    try:
        cli = InstituteCLI(args.role, args.base_path)

        # Route to appropriate command handler
        if args.command == 'task':
            if args.task_command == 'create':
                cli.task_create(args)
            elif args.task_command == 'list':
                cli.task_list(args)
            elif args.task_command == 'status':
                cli.task_status(args)

        elif args.command == 'inbox':
            if args.inbox_command == 'list':
                cli.inbox_list(args)
            elif args.inbox_command == 'read':
                cli.inbox_read(args)

        elif args.command == 'status':
            cli.status(args)

        elif args.command == 'escalation':
            if args.escalation_command == 'list':
                cli.escalation_list(args)
            elif args.escalation_command == 'ack':
                cli.escalation_ack(args)
            elif args.escalation_command == 'resolve':
                cli.escalation_resolve(args)

        elif args.command == 'report':
            if args.report_command == 'generate':
                cli.report_generate(args)
            elif args.report_command == 'list':
                cli.report_list(args)

        elif args.command == 'config':
            if args.config_command == 'show':
                cli.config_show(args)
            elif args.config_command == 'set':
                cli.config_set(args)

        elif args.command == 'recovery':
            if args.recovery_command == 'verify':
                cli.recovery_verify(args)
            elif args.recovery_command == 'confirm':
                cli.recovery_confirm(args)

        elif args.command == 'lockdown':
            if args.lockdown_command == 'trigger':
                cli.lockdown_trigger(args)

        elif args.command == 'audit':
            if args.audit_command == 'tail':
                cli.audit_tail(args)

    except PermissionError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
