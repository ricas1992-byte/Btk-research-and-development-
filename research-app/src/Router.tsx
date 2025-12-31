// ============================================
// Router Configuration
// ============================================

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from '@/api/client';
import { LoginScreen } from '@/screens/LoginScreen';
import { ResearchScreen } from '@/screens/ResearchScreen';
import { AdminScreen } from '@/screens/AdminScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // ==========================================
  // EMERGENCY BYPASS — Delete after Stage 2
  // ==========================================
  if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }
  // ==========================================

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a valid session cookie by calling /auth/me
        await api.getMe();
        setIsAuthenticated(true);
      } catch {
        // No valid session - redirect to login
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ResearchScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
