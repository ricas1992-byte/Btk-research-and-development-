// ============================================
// Common: Error Message Component
// ============================================

import React from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`error-message ${className}`} role="alert">
      {message}
    </div>
  );
}
