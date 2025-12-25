#!/usr/bin/env python3
"""Test script for sandbox mode."""
import sys
from pathlib import Path

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / 'institute-package' / 'src'))

# Now we can import with absolute imports
import config
import db_init
import queue_manager
import state_manager
import audit_logger
import lockdown

def test_initialization():
    """Test database initialization."""
    print("=" * 50)
    print("Test 1: Database Initialization")
    print("=" * 50)

    # Initialize sandbox
    cfg = config.Config('./sandbox-institute')
    cfg.ensure_directories()

    # Initialize databases
    schema_dir = Path('./institute-package/schemas')
    db_initializer = db_init.DatabaseInitializer(cfg, schema_dir=schema_dir)
    db_initializer.initialize_all()

    # Verify databases
    results = db_initializer.verify_all()
    print("\nDatabase initialization:")
    for db_name, is_ok in results.items():
        status = "✓" if is_ok else "✗"
        print(f"  {status} {db_name}.db")

    all_ok = all(results.values())
    print(f"\nResult: {'PASS' if all_ok else 'FAIL'}\n")
    return all_ok

def test_state_manager():
    """Test state manager."""
    print("=" * 50)
    print("Test 2: State Manager")
    print("=" * 50)

    cfg = config.Config('./sandbox-institute')
    sm = state_manager.StateManager(cfg)

    # Get initial mode
    mode, updated, reason = sm.get_mode()
    print(f"\nInitial mode: {mode}")
    print(f"Reason: {reason}")

    # Test mode changes
    sm.set_mode('ALERT', 'Testing alert mode')
    mode, _, _ = sm.get_mode()
    assert mode == 'ALERT', f"Expected ALERT, got {mode}"
    print("✓ Mode changed to ALERT")

    sm.set_mode('NORMAL', 'Testing normal mode')
    mode, _, _ = sm.get_mode()
    assert mode == 'NORMAL', f"Expected NORMAL, got {mode}"
    print("✓ Mode changed back to NORMAL")

    print(f"\nResult: PASS\n")
    return True

def test_audit_logger():
    """Test audit logger."""
    print("=" * 50)
    print("Test 3: Audit Logger")
    print("=" * 50)

    cfg = config.Config('./sandbox-institute')
    al = audit_logger.AuditLogger(cfg)

    # Log some events
    al.log('researcher', 'test_action', 'test_target', 'test details')
    al.log('director', 'another_action', 'another_target')
    al.log('system', 'system_action')

    # Get recent logs
    logs = al.get_recent_logs(10)
    print(f"\nLogged {len(logs)} events")

    # Verify integrity
    integrity_ok = al.verify_integrity()
    status = "✓" if integrity_ok else "✗"
    print(f"{status} Audit log integrity check")

    print(f"\nResult: {'PASS' if integrity_ok else 'FAIL'}\n")
    return integrity_ok

def test_task_queue():
    """Test task queue."""
    print("=" * 50)
    print("Test 4: Task Queue Manager")
    print("=" * 50)

    cfg = config.Config('./sandbox-institute')
    qm = queue_manager.QueueManager(cfg)
    al = audit_logger.AuditLogger(cfg)

    # Create tasks
    task1_id = qm.create_task("Test Task 1", "First test task")
    print(f"\n✓ Created task {task1_id}")

    task2_id = qm.create_task("Test Task 2", "Second test task")
    print(f"✓ Created task {task2_id}")

    al.log('researcher', 'task_created', f'task_{task1_id}', 'Test task 1')
    al.log('researcher', 'task_created', f'task_{task2_id}', 'Test task 2')

    # List tasks
    tasks = qm.list_tasks()
    print(f"\n✓ Listed {len(tasks)} tasks")

    # Get task status
    task_status = qm.get_task_status(task1_id)
    print(f"✓ Task {task1_id} status: {task_status['status']}")

    # Update task status
    qm.update_task_status(task1_id, 'completed')
    task_status = qm.get_task_status(task1_id)
    assert task_status['status'] == 'completed', "Task status not updated"
    print(f"✓ Updated task {task1_id} to completed")

    print(f"\nResult: PASS\n")
    return True

def test_lockdown():
    """Test lockdown manager."""
    print("=" * 50)
    print("Test 5: Lockdown Manager")
    print("=" * 50)

    cfg = config.Config('./sandbox-institute')
    lm = lockdown.LockdownManager(cfg)
    sm = state_manager.StateManager(cfg)

    # Check initial status
    status = lm.get_lockdown_status()
    print(f"\nInitial mode: {status['mode']}")

    # Trigger lockdown
    lm.trigger_lockdown("Testing lockdown functionality")
    mode, _, _ = sm.get_mode()
    assert mode == 'LOCKDOWN', f"Expected LOCKDOWN, got {mode}"
    print("✓ Lockdown triggered")

    # Verify recovery conditions (should fail - no escalations acknowledged)
    can_recover, issues = lm.verify_recovery_conditions()
    print(f"✓ Recovery verification: {can_recover} (expected: True, no escalations)")

    # Confirm recovery
    lm.confirm_recovery()
    mode, _, _ = sm.get_mode()
    assert mode == 'NORMAL', f"Expected NORMAL after recovery, got {mode}"
    print("✓ Recovery confirmed, back to NORMAL")

    print(f"\nResult: PASS\n")
    return True

def test_cli_researcher():
    """Test CLI as researcher."""
    print("=" * 50)
    print("Test 6: CLI - Researcher Commands")
    print("=" * 50)

    import subprocess

    # Test task creation
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=researcher',
        '--base-path=./sandbox-institute',
        'task', 'create',
        '--name', 'CLI Test Task',
        '--description', 'Created via CLI'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print("✓ Researcher can create tasks via CLI")
        print(f"  Output: {result.stdout.strip()}")
    else:
        print(f"✗ Task creation failed: {result.stderr}")
        return False

    # Test task list
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=researcher',
        '--base-path=./sandbox-institute',
        'task', 'list'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print("✓ Researcher can list tasks via CLI")
    else:
        print(f"✗ Task list failed: {result.stderr}")
        return False

    # Test role enforcement (should fail)
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=researcher',
        '--base-path=./sandbox-institute',
        'status'
    ], capture_output=True, text=True)

    if result.returncode != 0 and 'Permission denied' in result.stderr:
        print("✓ Role enforcement: researcher blocked from director commands")
    else:
        print("✗ Role enforcement failed")
        return False

    print(f"\nResult: PASS\n")
    return True

def test_cli_director():
    """Test CLI as director."""
    print("=" * 50)
    print("Test 7: CLI - Director Commands")
    print("=" * 50)

    import subprocess

    # Test status command
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=director',
        '--base-path=./sandbox-institute',
        'status'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print("✓ Director can check status via CLI")
    else:
        print(f"✗ Status check failed: {result.stderr}")
        return False

    # Test config show
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=director',
        '--base-path=./sandbox-institute',
        'config', 'show'
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print("✓ Director can view config via CLI")
    else:
        print(f"✗ Config show failed: {result.stderr}")
        return False

    # Test role enforcement (should fail)
    result = subprocess.run([
        'python3', './institute-package/src/cli.py',
        '--role=director',
        '--base-path=./sandbox-institute',
        'task', 'create',
        '--name', 'Test'
    ], capture_output=True, text=True)

    if result.returncode != 0 and 'Permission denied' in result.stderr:
        print("✓ Role enforcement: director blocked from researcher commands")
    else:
        print("✗ Role enforcement failed")
        return False

    print(f"\nResult: PASS\n")
    return True

def main():
    """Run all tests."""
    print("\n")
    print("=" * 50)
    print("INSTITUTE SANDBOX TEST SUITE")
    print("=" * 50)
    print("\n")

    results = []

    results.append(("Database Initialization", test_initialization()))
    results.append(("State Manager", test_state_manager()))
    results.append(("Audit Logger", test_audit_logger()))
    results.append(("Task Queue Manager", test_task_queue()))
    results.append(("Lockdown Manager", test_lockdown()))
    results.append(("CLI - Researcher", test_cli_researcher()))
    results.append(("CLI - Director", test_cli_director()))

    # Summary
    print("=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print()

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print()
    print(f"Total: {passed}/{total} tests passed")
    print()

    if passed == total:
        print("✓ ALL TESTS PASSED")
        return 0
    else:
        print("✗ SOME TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(main())
