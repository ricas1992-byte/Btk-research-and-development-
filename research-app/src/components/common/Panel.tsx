// ============================================
// Common: Panel Component
// ============================================

import React from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  footer?: React.ReactNode;
  side?: 'left' | 'right';
}

export function Panel({
  title,
  children,
  collapsed,
  onToggleCollapse,
  footer,
  side = 'left',
}: PanelProps) {
  return (
    <div className={`panel panel-${side} ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        {!collapsed && <h2 className="panel-title">{title}</h2>}
        <button
          className="panel-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (side === 'left' ? '→' : '←') : (side === 'left' ? '←' : '→')}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="panel-content">{children}</div>
          {footer && <div className="panel-footer">{footer}</div>}
        </>
      )}
    </div>
  );
}
