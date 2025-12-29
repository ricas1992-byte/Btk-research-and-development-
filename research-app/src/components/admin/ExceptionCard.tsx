// ============================================
// Admin: Exception Card
// ============================================

import React from 'react';
import type { AdminException } from '@shared/types';
import { Button } from '@/components/common/Button';
import './ExceptionCard.css';

interface ExceptionCardProps {
  exception: AdminException;
  onDismiss: (id: string) => void;
}

export function ExceptionCard({ exception, onDismiss }: ExceptionCardProps) {
  return (
    <div className={`exception-card severity-${exception.severity.toLowerCase()}`}>
      <div className="exception-header">
        <span className="exception-type">{exception.exception_type}</span>
        <span className="exception-severity">{exception.severity}</span>
      </div>
      <p className="exception-description">{exception.description}</p>
      <p className="exception-impact">
        <strong>Impact:</strong> {exception.impact}
      </p>
      <p className="exception-time">
        Detected: {new Date(exception.detected_at).toLocaleString()}
      </p>
      <div className="exception-actions">
        <Button onClick={() => onDismiss(exception.id)} variant="secondary">
          Dismiss
        </Button>
      </div>
    </div>
  );
}
