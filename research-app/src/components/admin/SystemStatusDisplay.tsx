// ============================================
// Admin: System Status Display
// ============================================

import React from 'react';
import type { SystemStatus } from '@shared/types';
import './SystemStatusDisplay.css';

interface SystemStatusDisplayProps {
  statuses: SystemStatus[];
}

export function SystemStatusDisplay({ statuses }: SystemStatusDisplayProps) {
  return (
    <div className="system-status-grid">
      {statuses.map((status) => (
        <div
          key={status.id}
          className={`status-item status-${status.status.toLowerCase()}`}
        >
          <div className="status-code">{status.function_code}</div>
          <div className="status-value">{status.status}</div>
          {status.message && (
            <div className="status-message">{status.message}</div>
          )}
        </div>
      ))}
    </div>
  );
}
