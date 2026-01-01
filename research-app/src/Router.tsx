// ============================================
// Router Configuration
// ============================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResearchScreen } from '@/screens/ResearchScreen';
import { AdminScreen } from '@/screens/AdminScreen';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ResearchScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
