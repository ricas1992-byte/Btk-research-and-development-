// ============================================
// Administration Screen
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Button } from '@/components/common/Button';
import { ExceptionCard } from '@/components/admin/ExceptionCard';
import { SystemStatusDisplay } from '@/components/admin/SystemStatusDisplay';
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
      await api.resolveException({
        exception_id: exceptionId,
        action: 'DISMISS',
      });

      // Remove from list
      setExceptions((prev) => prev.filter((ex) => ex.id !== exceptionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss exception');
    }
  };

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <img
              src="/logo.svg"
              alt="BTK Institute"
              style={{ width: '40px', height: '40px' }}
            />
          </div>
          <h1>Administration</h1>
        </div>
        <div className="admin-header-right">
          <Button onClick={() => navigate('/')} variant="secondary">
            ← Back to Research
          </Button>
        </div>
      </div>

      <div className="admin-body">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="admin-error">{error}</p>
        ) : (
          <>
            <div className="admin-section">
              <h2 className="admin-section-title">Exceptions</h2>
              {exceptions.length === 0 ? (
                <p className="admin-empty">No pending exceptions</p>
              ) : (
                <div className="admin-exceptions">
                  {exceptions.map((exception) => (
                    <ExceptionCard
                      key={exception.id}
                      exception={exception}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="admin-section">
              <h2 className="admin-section-title">System Status</h2>
              <SystemStatusDisplay statuses={systemStatus} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
