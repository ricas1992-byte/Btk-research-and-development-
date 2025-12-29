// ============================================
// Research Screen (Placeholder)
// ============================================

import React from 'react';
import '@/styles/screens/research.css';

export function ResearchScreen() {
  return (
    <div className="research-screen">
      <div className="research-header">
        <div className="research-header-left">
          <div className="research-logo">
            <img
              src="/logo.svg"
              alt="BTK Institute"
              style={{ width: '40px', height: '40px' }}
            />
          </div>
          <h1>Research Work</h1>
        </div>
        <div className="research-header-right">
          <button>Logout</button>
        </div>
      </div>
      <div className="research-body">
        <p style={{ padding: '2rem' }}>Research screen - Coming soon</p>
      </div>
    </div>
  );
}
