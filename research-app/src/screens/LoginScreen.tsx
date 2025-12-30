// ============================================
// Login Screen - Canonical v5.2
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import '@/styles/screens/login.css';

export function LoginScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await api.login({ username, password });
      navigate('/');
    } catch (err) {
      setError('Sign-in failed');
    }
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
              required
            />
          </div>

          <button type="submit" className="login-button">
            Sign in
          </button>
        </form>
      </div>

      <div className="login-footer"></div>
    </div>
  );
}
