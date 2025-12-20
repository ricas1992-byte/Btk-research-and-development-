import { useState } from 'react';
import { api } from '../api-client';
import { Button } from './shared/Button';
import { Dialog } from './shared/Dialog';
import { StatusBadge } from './shared/StatusBadge';

export function ParkingLot({ ideas, activePhaseExists, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const parkedIdeas = ideas.filter((i: any) => i.status === 'PARKED');

  const handleCreate = async () => {
    try {
      setError('');
      await api.createIdea(title, description);
      setTitle('');
      setDescription('');
      setShowDialog(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromote = async (id: string) => {
    try {
      setError('');
      await api.promoteIdea(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAbandon = async (id: string) => {
    try {
      setError('');
      await api.abandonIdea(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Parking Lot</h2>
        <Button onClick={() => setShowDialog(true)}>New Idea</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {parkedIdeas.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">No parked ideas. Create one to get started.</div>
        </div>
      )}

      {parkedIdeas.map((idea: any) => (
        <div key={idea.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{idea.title}</div>
              <div className="card-meta">
                <StatusBadge status={idea.status} />
              </div>
            </div>
          </div>
          {idea.description && <div className="card-content">{idea.description}</div>}
          <div className="card-actions">
            <Button
              variant="primary"
              onClick={() => handlePromote(idea.id)}
              disabled={activePhaseExists}
            >
              Promote to Phase
            </Button>
            <Button variant="secondary" onClick={() => handleAbandon(idea.id)}>
              Abandon
            </Button>
          </div>
        </div>
      ))}

      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Idea"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              Create
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter idea title"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>
      </Dialog>
    </div>
  );
}
