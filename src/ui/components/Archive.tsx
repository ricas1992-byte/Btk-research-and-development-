import { useState, useEffect } from 'react';
import { api } from '../api-client';
import { StatusBadge } from './shared/StatusBadge';
import { Dialog } from './shared/Dialog';
import { Button } from './shared/Button';

export function Archive() {
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [viewSnapshot, setViewSnapshot] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhases();
  }, []);

  const loadPhases = async () => {
    try {
      const data = (await api.getClosedPhases()) as any[];
      setPhases(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadSnapshots = async (phaseId: string) => {
    try {
      const data = (await api.getPhaseSnapshots(phaseId)) as any[];
      setSnapshots(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewPhase = (phase: any) => {
    setSelectedPhase(phase);
    loadSnapshots(phase.id);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Archive</h2>

      {error && <div className="error-message">{error}</div>}

      {phases.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">No closed phases yet.</div>
        </div>
      )}

      {phases.map((phase: any) => (
        <div key={phase.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{phase.title}</div>
              <div className="card-meta">
                <StatusBadge status={phase.status} />
                <span style={{ marginLeft: '8px' }}>
                  Closed: {new Date(phase.closedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {phase.objective && <div className="card-content">{phase.objective}</div>}
          <div className="card-actions">
            <Button variant="secondary" onClick={() => handleViewPhase(phase)}>
              View Snapshots
            </Button>
          </div>
        </div>
      ))}

      <Dialog
        isOpen={!!selectedPhase}
        onClose={() => setSelectedPhase(null)}
        title={selectedPhase ? `${selectedPhase.title} - Snapshots` : ''}
      >
        {snapshots.length === 0 && <p>No snapshots available.</p>}
        {snapshots.map((snap: any) => (
          <div key={snap.id} className="card">
            <div className="card-header">
              <div className="card-title">{snap.title}</div>
            </div>
            <div className="card-actions">
              <Button variant="secondary" onClick={() => setViewSnapshot(snap)}>
                View Content
              </Button>
            </div>
          </div>
        ))}
      </Dialog>

      <Dialog
        isOpen={!!viewSnapshot}
        onClose={() => setViewSnapshot(null)}
        title={viewSnapshot ? viewSnapshot.title : ''}
      >
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
          {viewSnapshot?.content || 'No content'}
        </div>
      </Dialog>
    </div>
  );
}
