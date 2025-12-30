import { useState, useEffect, useRef } from 'react';

interface BootLog {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'warning';
}

interface ErrorDetails {
  message: string;
  stack?: string;
  type: 'onerror' | 'unhandledrejection';
  timestamp: number;
}

export function DebugOverlay() {
  const [bootLogs, setBootLogs] = useState<BootLog[]>([]);
  const [errors, setErrors] = useState<ErrorDetails[]>([]);
  const [isStalled, setIsStalled] = useState(false);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  // Environment variable checks
  const requiredEnvVars = {
    'VITE_API_BASE': import.meta.env.VITE_API_BASE || 'NOT SET (using default /api)',
    'NODE_ENV': import.meta.env.MODE || 'development',
  };

  const addBootLog = (message: string, type: BootLog['type'] = 'info') => {
    setBootLogs(prev => [...prev, {
      timestamp: Date.now() - startTimeRef.current,
      message,
      type,
    }]);
  };

  useEffect(() => {
    // Initial boot logs
    addBootLog('DebugOverlay mounted');
    addBootLog(`Environment: ${import.meta.env.MODE}`);
    addBootLog('Checking required environment variables...');

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      const type = value.includes('NOT SET') ? 'warning' : 'info';
      addBootLog(`${key}: ${value}`, type);
    });

    addBootLog('Setting up error handlers...');

    // Set up global error handlers
    const handleError = (event: ErrorEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.message,
        stack: event.error?.stack,
        type: 'onerror',
        timestamp: Date.now(),
      };
      setErrors(prev => [...prev, errorDetails]);
      addBootLog(`ERROR: ${event.message}`, 'error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'unhandledrejection',
        timestamp: Date.now(),
      };
      setErrors(prev => [...prev, errorDetails]);
      addBootLog(`UNHANDLED REJECTION: ${errorDetails.message}`, 'error');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    addBootLog('Error handlers registered');
    addBootLog('Starting 5s stall timer...');

    // Set up 5s stall timer
    stallTimerRef.current = setTimeout(() => {
      setIsStalled(true);
      addBootLog('BOOT STALLED: 5 second timeout reached', 'error');
    }, 5000);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
      }
    };
  }, []);

  // Clear stall timer when component unmounts (meaning boot completed)
  useEffect(() => {
    return () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        addBootLog('Boot completed, clearing stall timer');
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0a0a0a',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 9999,
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#00ff00', fontSize: '18px', marginBottom: '10px' }}>
          🔧 Production Debug Overlay
        </h1>
        <div style={{ color: '#666', fontSize: '11px' }}>
          Boot Time: {Date.now() - startTimeRef.current}ms
        </div>
      </div>

      {isStalled && (
        <div style={{
          backgroundColor: '#ff0000',
          color: '#fff',
          padding: '15px',
          marginBottom: '20px',
          border: '2px solid #ff0000',
          fontWeight: 'bold',
        }}>
          ⚠️ BOOT STALLED
          <div style={{ fontSize: '11px', marginTop: '5px', fontWeight: 'normal' }}>
            Application failed to load within 5 seconds. Check boot logs and errors below.
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#ff3333', fontSize: '14px', marginBottom: '10px' }}>
            ❌ Errors ({errors.length})
          </h2>
          {errors.map((error, idx) => (
            <div key={idx} style={{
              backgroundColor: '#1a0000',
              border: '1px solid #ff3333',
              padding: '10px',
              marginBottom: '10px',
            }}>
              <div style={{ color: '#ff6666', fontWeight: 'bold' }}>
                [{error.type}] {error.message}
              </div>
              {error.stack && (
                <pre style={{
                  color: '#ff9999',
                  fontSize: '10px',
                  marginTop: '5px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {error.stack}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#00ff00', fontSize: '14px', marginBottom: '10px' }}>
          📋 Boot Logs
        </h2>
        <div style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #333',
          padding: '10px',
        }}>
          {bootLogs.map((log, idx) => (
            <div key={idx} style={{
              color: log.type === 'error' ? '#ff3333' :
                     log.type === 'warning' ? '#ffaa00' : '#00ff00',
              marginBottom: '3px',
            }}>
              <span style={{ color: '#666' }}>[+{log.timestamp}ms]</span>{' '}
              {log.message}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ color: '#00ff00', fontSize: '14px', marginBottom: '10px' }}>
          🔐 Environment Variables
        </h2>
        <div style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #333',
          padding: '10px',
        }}>
          {Object.entries(requiredEnvVars).map(([key, value]) => (
            <div key={key} style={{
              marginBottom: '3px',
              color: value.includes('NOT SET') ? '#ffaa00' : '#00ff00',
            }}>
              <span style={{ fontWeight: 'bold' }}>{key}:</span> {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
