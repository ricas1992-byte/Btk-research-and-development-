#!/bin/bash
set -euo pipefail

# Institute Research Management System - Verification Script

INSTALL_DIR="/institute"
PASS=0
FAIL=0

echo "========================================="
echo "Institute Verification"
echo "========================================="
echo ""

# Helper functions
pass() {
    echo "  ✓ PASS: $1"
    ((PASS++))
}

fail() {
    echo "  ✗ FAIL: $1"
    ((FAIL++))
}

# Test 1: Check users exist
echo "Test 1: Checking users..."
if id -u researcher > /dev/null 2>&1; then
    pass "User 'researcher' exists"
else
    fail "User 'researcher' does not exist"
fi

if id -u director > /dev/null 2>&1; then
    pass "User 'director' exists"
else
    fail "User 'director' does not exist"
fi

if id -u institute-system > /dev/null 2>&1; then
    pass "User 'institute-system' exists"
else
    fail "User 'institute-system' does not exist"
fi

echo ""

# Test 2: Check directory structure
echo "Test 2: Checking directory structure..."
for dir in research management shared system logs inbox queues db; do
    if [[ -d "$INSTALL_DIR/$dir" ]]; then
        pass "Directory '$dir' exists"
    else
        fail "Directory '$dir' missing"
    fi
done

echo ""

# Test 3: Check databases
echo "Test 3: Checking databases..."
for db in system.db research.db management.db shared.db audit.db; do
    if [[ -f "$INSTALL_DIR/db/$db" ]]; then
        pass "Database '$db' exists"
    else
        fail "Database '$db' missing"
    fi
done

echo ""

# Test 4: Check CLI
echo "Test 4: Checking CLI..."
if [[ -f /usr/local/bin/institute ]]; then
    pass "CLI installed at /usr/local/bin/institute"
else
    fail "CLI not found at /usr/local/bin/institute"
fi

echo ""

# Test 5: Check services
echo "Test 5: Checking systemd services..."
if systemctl is-active --quiet institute-watchdog.service; then
    pass "Watchdog service running"
else
    fail "Watchdog service not running"
fi

if systemctl is-active --quiet institute-escalation.service; then
    pass "Escalation service running"
else
    fail "Escalation service not running"
fi

if systemctl is-active --quiet institute-task-processor.timer; then
    pass "Task processor timer active"
else
    fail "Task processor timer not active"
fi

echo ""

# Test 6: Test researcher commands
echo "Test 6: Testing researcher commands..."

# Test task creation (as researcher)
if sudo -u researcher institute --role=researcher task create --name "Test Task" --description "Verification test" > /dev/null 2>&1; then
    pass "Researcher can create tasks"
else
    fail "Researcher cannot create tasks"
fi

# Test task list (as researcher)
if sudo -u researcher institute --role=researcher task list > /dev/null 2>&1; then
    pass "Researcher can list tasks"
else
    fail "Researcher cannot list tasks"
fi

# Test role enforcement (researcher trying director command should fail)
if sudo -u researcher institute --role=researcher status > /dev/null 2>&1; then
    fail "Role enforcement broken: researcher executed director command"
else
    pass "Role enforcement: researcher blocked from director commands"
fi

echo ""

# Test 7: Test director commands
echo "Test 7: Testing director commands..."

# Test status command (as director)
if sudo -u director institute --role=director status > /dev/null 2>&1; then
    pass "Director can check status"
else
    fail "Director cannot check status"
fi

# Test config show (as director)
if sudo -u director institute --role=director config show > /dev/null 2>&1; then
    pass "Director can view configuration"
else
    fail "Director cannot view configuration"
fi

# Test role enforcement (director trying researcher command should fail)
if sudo -u director institute --role=director task create --name "Test" > /dev/null 2>&1; then
    fail "Role enforcement broken: director executed researcher command"
else
    pass "Role enforcement: director blocked from researcher commands"
fi

echo ""

# Test 8: Test audit log
echo "Test 8: Testing audit log..."
if sudo -u director institute --role=director audit tail 10 > /dev/null 2>&1; then
    pass "Audit log accessible"
else
    fail "Audit log not accessible"
fi

# Check if audit log has entries
LOG_COUNT=$(sudo -u institute-system sqlite3 "$INSTALL_DIR/db/audit.db" "SELECT COUNT(*) FROM log" 2>/dev/null || echo "0")
if [[ "$LOG_COUNT" -gt 0 ]]; then
    pass "Audit log contains $LOG_COUNT entries"
else
    fail "Audit log is empty"
fi

echo ""

# Test 9: Test watchdog heartbeat
echo "Test 9: Testing watchdog..."
if [[ -f "$INSTALL_DIR/system/heartbeat/watchdog" ]]; then
    HEARTBEAT_AGE=$(( $(date +%s) - $(stat -c %Y "$INSTALL_DIR/system/heartbeat/watchdog") ))
    if [[ $HEARTBEAT_AGE -lt 120 ]]; then
        pass "Watchdog heartbeat recent (${HEARTBEAT_AGE}s ago)"
    else
        fail "Watchdog heartbeat stale (${HEARTBEAT_AGE}s ago)"
    fi
else
    fail "Watchdog heartbeat file not found"
fi

echo ""

# Test 10: Test database integrity
echo "Test 10: Testing database integrity..."
for db in system.db research.db management.db shared.db audit.db; do
    INTEGRITY=$(sudo -u institute-system sqlite3 "$INSTALL_DIR/db/$db" "PRAGMA integrity_check" 2>/dev/null || echo "error")
    if [[ "$INTEGRITY" == "ok" ]]; then
        pass "Database integrity: $db"
    else
        fail "Database integrity failed: $db"
    fi
done

echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo "PASSED: $PASS"
echo "FAILED: $FAIL"
echo ""

if [[ $FAIL -eq 0 ]]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed. Please review the output above."
    exit 1
fi
