// ============================================
// Administration Screen - TEXT ONLY (v5.2)
// NO cards, badges, icons per plan
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { AdminException, SystemStatus } from '@shared/types';
import '@/styles/screens/admin.css';

export function AdminScreen() {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState<AdminException[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [exceptionsData, statusData] = await Promise.all([
        api.getExceptions(),
        api.getSystemStatus(),
      ]);

      setExceptions(exceptionsData);
      setSystemStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (exceptionId: string) => {
    try {
      await api.dismissException(exceptionId);
      setExceptions((prev) => prev.filter((ex) => ex.id !== exceptionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss exception');
    }
  };

  return (
    <div className="admin-screen-text">
      {/* Header: Logo + Title + Back Button */}
      <div className="admin-header-text">
        <div className="admin-title">
          <span className="admin-logo-text">BTK</span>
          <h1>Administration</h1>
        </div>
        <button onClick={() => navigate('/')} className="admin-back-button">
          Back to Research
        </button>
      </div>

      <div className="admin-body-text">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="admin-error-text">{error}</p>
        ) : (
          <>
            {/* Exceptions Section - Plain Text */}
            <div className="admin-section-text">
              <h2>Exceptions</h2>
              {exceptions.length === 0 ? (
                <p>No pending exceptions</p>
              ) : (
                <div className="exceptions-list-text">
                  {exceptions.map((exception, index) => (
                    <div key={exception.id} className="exception-text-block">
                      <p className="exception-line">
                        [{index + 1}] {exception.exception_type} — {exception.severity}
                      </p>
                      <p className="exception-line">
                        Description: {exception.description}
                      </p>
                      <p className="exception-line">
                        Impact: {exception.impact}
                      </p>
                      <p className="exception-line">
                        Detected: {new Date(exception.detected_at).toLocaleString()}
                      </p>
                      <p className="exception-line">
                        <button
                          onClick={() => handleDismiss(exception.id)}
                          className="dismiss-button-text"
                        >
                          [Dismiss]
                        </button>
                      </p>
                      {index < exceptions.length - 1 && <hr className="exception-separator" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Status Section - Plain Text */}
            <div className="admin-section-text">
              <h2>System Status</h2>
              <div className="status-list-text">
                {systemStatus.map((status) => (
                  <p key={status.function_code} className="status-line">
                    {status.function_code}: {status.status}
                    {status.message && ` — ${status.message}`}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
