// ============================================
// Common: Input Component
// ============================================

import React from 'react';
import './Input.css';

interface InputProps {
  type?: 'text' | 'email' | 'password';
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

export function Input({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  error,
  required = false,
  disabled = false,
  autoComplete,
  autoFocus = false,
}: InputProps) {
  // Permissive RFC-safe email pattern that accepts most valid email formats
  // This overrides the overly restrictive browser default for type="email"
  const emailPattern = type === 'email' ? '.+@.+\\..+' : undefined;

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        pattern={emailPattern}
        className={`input ${error ? 'input-error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="input-error-message">
          {error}
        </span>
      )}
    </div>
  );
}
