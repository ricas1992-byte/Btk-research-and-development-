#!/bin/bash
set -euo pipefail

# Institute Research Management System - Installation Script
# This script must be run as root

INSTALL_DIR="/institute"
PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================="
echo "Institute Installation"
echo "========================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run as root"
   exit 1
fi

echo "Step 1: Creating users and groups..."

# Create groups
if ! getent group institute-system > /dev/null 2>&1; then
    groupadd institute-system
    echo "  Created group: institute-system"
fi

if ! getent group institute-shared > /dev/null 2>&1; then
    groupadd institute-shared
    echo "  Created group: institute-shared"
fi

if ! getent group researcher > /dev/null 2>&1; then
    groupadd researcher
    echo "  Created group: researcher"
fi

if ! getent group director > /dev/null 2>&1; then
    groupadd director
    echo "  Created group: director"
fi

# Create users
if ! id -u institute-system > /dev/null 2>&1; then
    useradd -r -s /bin/bash -g institute-system -G institute-shared -m institute-system
    echo "  Created user: institute-system"
else
    usermod -a -G institute-shared institute-system
    echo "  Updated user: institute-system"
fi

if ! id -u researcher > /dev/null 2>&1; then
    useradd -s /bin/bash -g researcher -G institute-shared -m researcher
    echo "  Created user: researcher"
else
    usermod -a -G institute-shared researcher
    echo "  Updated user: researcher"
fi

if ! id -u director > /dev/null 2>&1; then
    useradd -s /bin/bash -g director -G institute-shared -m director
    echo "  Created user: director"
else
    usermod -a -G institute-shared director
    echo "  Updated user: director"
fi

echo ""
echo "Step 2: Creating directory structure..."

# Create base directory
mkdir -p "$INSTALL_DIR"

# Create all directories
mkdir -p "$INSTALL_DIR"/{research,management,shared,system,logs,inbox,queues,db}
mkdir -p "$INSTALL_DIR"/research/{data,scripts,outputs}
mkdir -p "$INSTALL_DIR"/management/{config,escalations}
mkdir -p "$INSTALL_DIR"/shared/{reports,templates}
mkdir -p "$INSTALL_DIR"/system/{bin,heartbeat,alerts}
mkdir -p "$INSTALL_DIR"/inbox/{researcher,director}
mkdir -p "$INSTALL_DIR"/queues/research/{pending,processing,completed,failed}
mkdir -p "$INSTALL_DIR"/queues/management/{pending,escalations}

echo "  Created directory structure"

echo ""
echo "Step 3: Setting permissions..."

# Set ownership and permissions for research directory (researcher only)
chown -R researcher:researcher "$INSTALL_DIR"/research
chmod 700 "$INSTALL_DIR"/research
chmod 700 "$INSTALL_DIR"/research/{data,scripts,outputs}

# Set ownership and permissions for management directory (director only)
chown -R director:director "$INSTALL_DIR"/management
chmod 700 "$INSTALL_DIR"/management
chmod 700 "$INSTALL_DIR"/management/{config,escalations}

# Set ownership and permissions for shared directory (both roles)
chown -R institute-system:institute-shared "$INSTALL_DIR"/shared
chmod 755 "$INSTALL_DIR"/shared
chmod 755 "$INSTALL_DIR"/shared/{reports,templates}

# Set ownership and permissions for system directory (system only)
chown -R institute-system:institute-system "$INSTALL_DIR"/system
chmod 700 "$INSTALL_DIR"/system
chmod 700 "$INSTALL_DIR"/system/{bin,heartbeat,alerts}

# Set ownership and permissions for logs (append-only)
chown -R institute-system:institute-shared "$INSTALL_DIR"/logs
chmod 755 "$INSTALL_DIR"/logs

# Set ownership and permissions for inbox
chown -R researcher:researcher "$INSTALL_DIR"/inbox/researcher
chmod 700 "$INSTALL_DIR"/inbox/researcher
chown -R director:director "$INSTALL_DIR"/inbox/director
chmod 700 "$INSTALL_DIR"/inbox/director

# Set ownership and permissions for queues
chown -R institute-system:institute-system "$INSTALL_DIR"/queues
chmod -R 755 "$INSTALL_DIR"/queues

# Set ownership and permissions for db
chown -R institute-system:institute-shared "$INSTALL_DIR"/db
chmod 755 "$INSTALL_DIR"/db

echo "  Set directory permissions"

echo ""
echo "Step 4: Installing Python modules..."

# Copy source files
cp -r "$PACKAGE_DIR"/src/* "$INSTALL_DIR"/system/bin/
chmod +x "$INSTALL_DIR"/system/bin/*.py

# Copy schemas
mkdir -p "$INSTALL_DIR"/system/schemas
cp "$PACKAGE_DIR"/schemas/* "$INSTALL_DIR"/system/schemas/

# Copy templates
cp "$PACKAGE_DIR"/templates/* "$INSTALL_DIR"/shared/templates/

echo "  Installed Python modules"

echo ""
echo "Step 5: Installing CLI..."

# Create CLI wrapper
cat > /usr/local/bin/institute << 'EOF'
#!/bin/bash
exec /usr/bin/python3 /institute/system/bin/cli.py "$@"
EOF

chmod +x /usr/local/bin/institute

echo "  Installed CLI at /usr/local/bin/institute"

echo ""
echo "Step 6: Initializing databases..."

# Initialize databases as institute-system user
sudo -u institute-system /usr/bin/python3 << 'PYTHON_EOF'
import sys
sys.path.insert(0, '/institute/system/bin')

from config import Config
from db_init import DatabaseInitializer
from pathlib import Path

config = Config()
config.ensure_directories()

db_init = DatabaseInitializer(config, schema_dir=Path('/institute/system/schemas'))
db_init.initialize_all()

print("  Databases initialized successfully")
PYTHON_EOF

# Set database permissions
chown institute-system:institute-shared "$INSTALL_DIR"/db/*.db
chmod 664 "$INSTALL_DIR"/db/system.db
chmod 664 "$INSTALL_DIR"/db/research.db
chmod 664 "$INSTALL_DIR"/db/management.db
chmod 664 "$INSTALL_DIR"/db/shared.db
chmod 664 "$INSTALL_DIR"/db/audit.db

echo ""
echo "Step 7: Installing systemd units..."

# Copy systemd unit files
cp "$PACKAGE_DIR"/systemd/*.service /etc/systemd/system/
cp "$PACKAGE_DIR"/systemd/*.timer /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

echo "  Installed systemd units"

echo ""
echo "Step 8: Enabling and starting services..."

# Enable and start services
systemctl enable institute-watchdog.service
systemctl enable institute-escalation.service
systemctl enable institute-task-processor.timer
systemctl enable institute-daily-report.timer
systemctl enable institute-weekly-report.timer

systemctl start institute-watchdog.service
systemctl start institute-escalation.service
systemctl start institute-task-processor.timer
systemctl start institute-daily-report.timer
systemctl start institute-weekly-report.timer

echo "  Services enabled and started"

echo ""
echo "Step 9: Verifying installation..."

# Check service status
echo "  Checking service status..."
sleep 2

if systemctl is-active --quiet institute-watchdog.service; then
    echo "    ✓ Watchdog service running"
else
    echo "    ✗ Watchdog service not running"
fi

if systemctl is-active --quiet institute-escalation.service; then
    echo "    ✓ Escalation service running"
else
    echo "    ✗ Escalation service not running"
fi

if systemctl is-active --quiet institute-task-processor.timer; then
    echo "    ✓ Task processor timer active"
else
    echo "    ✗ Task processor timer not active"
fi

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Users created:"
echo "  - researcher (role: researcher)"
echo "  - director (role: director)"
echo "  - institute-system (system user)"
echo ""
echo "Services running:"
echo "  - institute-watchdog.service"
echo "  - institute-escalation.service"
echo "  - institute-task-processor.timer"
echo "  - institute-daily-report.timer"
echo "  - institute-weekly-report.timer"
echo ""
echo "CLI available at: /usr/local/bin/institute"
echo ""
echo "Usage:"
echo "  Researcher: institute --role=researcher task create --name \"Task name\""
echo "  Director:   institute --role=director status"
echo ""
echo "To test, run: $PACKAGE_DIR/bootstrap/verify.sh"
echo ""
