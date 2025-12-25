#!/usr/bin/env python3
"""Report generator for the Institute system."""
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

try:
    from .audit_logger import AuditLogger
    from .config import Config
    from .state_manager import StateManager
except ImportError:
    from audit_logger import AuditLogger
    from config import Config
    from state_manager import StateManager


class ReportGenerator:
    """Generates daily and weekly reports."""

    def __init__(self, config: Config, template_dir: Path = None):
        """Initialize report generator.

        Args:
            config: System configuration
            template_dir: Path to Jinja2 templates (default: ../templates)
        """
        self.config = config
        self.state_manager = StateManager(config)
        self.audit_logger = AuditLogger(config)

        # Setup Jinja2 environment
        if template_dir is None:
            module_dir = Path(__file__).parent
            template_dir = module_dir.parent / "templates"

        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=False
        )

    def generate_daily_report(self) -> Path:
        """Generate daily status report.

        Returns:
            Path to generated report
        """
        today = datetime.now()
        date_str = today.strftime('%Y-%m-%d')

        # Gather data
        data = self.gather_daily_data(today)

        # Render template
        template = self.jinja_env.get_template('daily_status.md.j2')
        content = template.render(**data)

        # Write report
        report_dir = self.config.shared_reports_dir / date_str
        report_dir.mkdir(parents=True, exist_ok=True)
        report_file = report_dir / "daily.md"
        report_file.write_text(content)

        # Record in database
        self.record_report('daily', str(report_file))

        self.audit_logger.log(
            'system',
            'report_generated',
            target='daily',
            details=date_str
        )

        return report_file

    def generate_weekly_report(self) -> Path:
        """Generate weekly summary report.

        Returns:
            Path to generated report
        """
        today = datetime.now()
        date_str = today.strftime('%Y-%m-%d')

        # Gather data for past week
        data = self.gather_weekly_data(today)

        # Render template
        template = self.jinja_env.get_template('weekly_summary.md.j2')
        content = template.render(**data)

        # Write report
        report_dir = self.config.shared_reports_dir / date_str
        report_dir.mkdir(parents=True, exist_ok=True)
        report_file = report_dir / "weekly.md"
        report_file.write_text(content)

        # Record in database
        self.record_report('weekly', str(report_file))

        self.audit_logger.log(
            'system',
            'report_generated',
            target='weekly',
            details=date_str
        )

        return report_file

    def gather_daily_data(self, date: datetime) -> dict:
        """Gather data for daily report.

        Args:
            date: Date for report

        Returns:
            Dictionary of report data
        """
        # System mode
        mode, mode_updated, mode_reason = self.state_manager.get_mode()

        # Task statistics for today
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()

        cursor.execute(
            "SELECT status, COUNT(*) FROM tasks WHERE date(created_at) = date('now') GROUP BY status"
        )
        task_stats = dict(cursor.fetchall())

        cursor.execute(
            "SELECT COUNT(*) FROM tasks WHERE status = 'pending'"
        )
        pending_tasks = cursor.fetchone()[0]

        conn.close()

        # Escalation statistics
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM escalations WHERE state NOT IN ('RESOLVED', 'EXPIRED')"
        )
        active_escalations = cursor.fetchone()[0]

        cursor.execute(
            "SELECT level, COUNT(*) FROM escalations WHERE state NOT IN ('RESOLVED', 'EXPIRED') GROUP BY level"
        )
        escalation_by_level = dict(cursor.fetchall())

        conn.close()

        # Recent audit events
        recent_events = self.audit_logger.get_recent_logs(limit=20)

        return {
            'date': date.strftime('%Y-%m-%d'),
            'generated_at': datetime.now().isoformat(),
            'system_mode': mode,
            'mode_updated': mode_updated,
            'mode_reason': mode_reason,
            'task_stats': task_stats,
            'pending_tasks': pending_tasks,
            'active_escalations': active_escalations,
            'escalation_by_level': escalation_by_level,
            'recent_events': recent_events
        }

    def gather_weekly_data(self, end_date: datetime) -> dict:
        """Gather data for weekly report.

        Args:
            end_date: End date for report

        Returns:
            Dictionary of report data
        """
        start_date = end_date - timedelta(days=7)

        # System mode
        mode, mode_updated, mode_reason = self.state_manager.get_mode()

        # Task statistics for the week
        conn = sqlite3.connect(str(self.config.research_db))
        cursor = conn.cursor()

        cursor.execute(
            """SELECT status, COUNT(*)
               FROM tasks
               WHERE created_at >= datetime(?)
               GROUP BY status""",
            (start_date.isoformat(),)
        )
        task_stats = dict(cursor.fetchall())

        cursor.execute(
            "SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND completed_at >= datetime(?)",
            (start_date.isoformat(),)
        )
        completed_this_week = cursor.fetchone()[0]

        conn.close()

        # Escalations resolved this week
        conn = sqlite3.connect(str(self.config.management_db))
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM escalations WHERE resolved_at >= datetime(?)",
            (start_date.isoformat(),)
        )
        resolved_escalations = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM escalations WHERE state NOT IN ('RESOLVED', 'EXPIRED')"
        )
        active_escalations = cursor.fetchone()[0]

        conn.close()

        return {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'generated_at': datetime.now().isoformat(),
            'system_mode': mode,
            'task_stats': task_stats,
            'completed_this_week': completed_this_week,
            'resolved_escalations': resolved_escalations,
            'active_escalations': active_escalations
        }

    def record_report(self, report_type: str, file_path: str):
        """Record report generation in shared.db.

        Args:
            report_type: Type of report (daily, weekly)
            file_path: Path to generated report
        """
        conn = sqlite3.connect(str(self.config.shared_db))
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO reports (type, path) VALUES (?, ?)",
            (report_type, file_path)
        )
        conn.commit()
        conn.close()

    def list_reports(self, report_type: str = None) -> list:
        """List generated reports.

        Args:
            report_type: Filter by type (optional)

        Returns:
            List of report records
        """
        conn = sqlite3.connect(str(self.config.shared_db))
        cursor = conn.cursor()

        if report_type:
            cursor.execute(
                "SELECT id, type, path, generated_at FROM reports WHERE type = ? ORDER BY generated_at DESC",
                (report_type,)
            )
        else:
            cursor.execute(
                "SELECT id, type, path, generated_at FROM reports ORDER BY generated_at DESC"
            )

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                'id': row[0],
                'type': row[1],
                'path': row[2],
                'generated_at': row[3]
            }
            for row in rows
        ]


def main():
    """Main entry point for report generator."""
    # Parse command-line arguments
    base_path = None
    report_type = 'daily'

    for arg in sys.argv[1:]:
        if arg.startswith('--base-path='):
            base_path = arg.split('=', 1)[1]
        elif arg.startswith('--type='):
            report_type = arg.split('=', 1)[1]

    # Initialize and run
    config = Config(base_path)
    generator = ReportGenerator(config)

    try:
        if report_type == 'daily':
            report_file = generator.generate_daily_report()
            print(f"Daily report generated: {report_file}")
        elif report_type == 'weekly':
            report_file = generator.generate_weekly_report()
            print(f"Weekly report generated: {report_file}")
        else:
            print(f"Unknown report type: {report_type}", file=sys.stderr)
            sys.exit(1)

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
