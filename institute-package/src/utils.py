"""Utility functions for the Institute system."""
import hashlib
import os
import pwd
from datetime import datetime
from pathlib import Path
from typing import Optional


def get_current_user() -> str:
    """Get the current Unix username.

    Returns:
        Username of current user
    """
    try:
        return pwd.getpwuid(os.getuid()).pw_name
    except Exception:
        return os.environ.get('USER', 'unknown')


def compute_checksum(data: str) -> str:
    """Compute SHA256 checksum of data.

    Args:
        data: String data to checksum

    Returns:
        Hex digest of SHA256 hash
    """
    return hashlib.sha256(data.encode()).hexdigest()


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format datetime as ISO 8601 string.

    Args:
        dt: Datetime to format (default: now)

    Returns:
        ISO 8601 formatted timestamp
    """
    if dt is None:
        dt = datetime.now()
    return dt.isoformat()


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse ISO 8601 timestamp string.

    Args:
        timestamp_str: ISO 8601 timestamp

    Returns:
        Parsed datetime object
    """
    return datetime.fromisoformat(timestamp_str)


def acquire_lock(lock_file: Path) -> bool:
    """Acquire a file lock.

    Args:
        lock_file: Path to lock file

    Returns:
        True if lock acquired, False if already locked
    """
    try:
        # Create lock file exclusively
        fd = os.open(str(lock_file), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return True
    except FileExistsError:
        # Check if the process holding the lock is still alive
        try:
            with open(lock_file, 'r') as f:
                pid = int(f.read().strip())

            # Try to check if process exists
            try:
                os.kill(pid, 0)  # Doesn't actually kill, just checks
                return False  # Process exists, lock is valid
            except ProcessLookupError:
                # Process doesn't exist, remove stale lock
                lock_file.unlink()
                return acquire_lock(lock_file)
        except Exception:
            return False
    except Exception:
        return False


def release_lock(lock_file: Path):
    """Release a file lock.

    Args:
        lock_file: Path to lock file
    """
    try:
        lock_file.unlink()
    except FileNotFoundError:
        pass


def get_disk_usage(path: Path) -> float:
    """Get disk usage percentage for a path.

    Args:
        path: Path to check

    Returns:
        Disk usage percentage (0-100)
    """
    try:
        stat = os.statvfs(str(path))
        total = stat.f_blocks * stat.f_frsize
        free = stat.f_bavail * stat.f_frsize
        used = total - free
        return (used / total) * 100 if total > 0 else 0
    except Exception:
        return 0


def get_file_age_minutes(file_path: Path) -> float:
    """Get age of file in minutes.

    Args:
        file_path: Path to file

    Returns:
        Age in minutes, or infinity if file doesn't exist
    """
    try:
        mtime = file_path.stat().st_mtime
        now = datetime.now().timestamp()
        return (now - mtime) / 60
    except FileNotFoundError:
        return float('inf')


def ensure_parent_dir(file_path: Path):
    """Ensure parent directory of a file exists.

    Args:
        file_path: Path to file
    """
    file_path.parent.mkdir(parents=True, exist_ok=True)
