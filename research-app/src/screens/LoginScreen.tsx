// ============================================
// Login Screen - Canonical v5.2
// ============================================

import React, { useState, FormEvent } from 'react';
import '@/styles/screens/login.css';

interface Props {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await onLogin(username, password);

    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/logo.svg" alt="Beyond the Keys" />
      </div>

      <div className="login-content">
        <h1 className="login-title">Sign in</h1>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <div className="login-footer"></div>
    </div>
  );
}
