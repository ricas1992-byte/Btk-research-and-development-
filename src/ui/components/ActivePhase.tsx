import { useState, useEffect } from 'react';
import { api } from '../api-client';
import { Button } from './shared/Button';
import { Dialog } from './shared/Dialog';
import { StatusBadge } from './shared/StatusBadge';
import { PlainTextArea } from './shared/PlainTextArea';

export function ActivePhase({ phase, onRefresh }: any) {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [closeToken, setCloseToken] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeConfirmation, setCloseConfirmation] = useState('');

  useEffect(() => {
    if (phase) {
      loadData();
    }
  }, [phase]);

  const loadData = async () => {
    if (!phase) return;
    try {
      const [docs, decs, tsks] = (await Promise.all([
        api.getDocuments(phase.id),
        api.getDecisions(phase.id),
        api.getTasks({ phaseId: phase.id }),
      ])) as [any[], any[], any[]];
      setDocuments(docs);
      setDecisions(decs);
      setTasks(tsks);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRequestClose = async () => {
    try {
      const response: any = await api.requestCloseToken(phase.id);
      setCloseToken(response.token);
      setShowCloseDialog(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClosePhase = async () => {
    try {
      setError('');
      await api.closePhase(phase.id, closeToken, closeConfirmation);
      setShowCloseDialog(false);
      setCloseConfirmation('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!phase) {
    return (
      <div className="empty-state">
        <div className="empty-state-text">
          No active phase. Promote an idea from the Parking Lot.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="context-bar">
        <div>
          <strong>{phase.title}</strong>
          <div className="context-bar-info">{phase.objective}</div>
        </div>
        <Button variant="danger" onClick={handleRequestClose}>
          Close Phase
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          className={`tab ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          Decisions
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </button>
      </div>

      {activeTab === 'documents' && (
        <DocumentsTab phaseId={phase.id} documents={documents} onRefresh={loadData} />
      )}
      {activeTab === 'decisions' && (
        <DecisionsTab phaseId={phase.id} decisions={decisions} onRefresh={loadData} />
      )}
      {activeTab === 'tasks' && (
        <TasksTab tasks={tasks} decisions={decisions} onRefresh={loadData} />
      )}

      <Dialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        title="Close Phase"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClosePhase}
              disabled={closeConfirmation !== 'CLOSE'}
            >
              Close Phase
            </Button>
          </>
        }
      >
        <p>This will create snapshots of all documents and close the phase permanently.</p>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Type "CLOSE" to confirm</label>
          <input
            className="form-input"
            value={closeConfirmation}
            onChange={(e) => setCloseConfirmation(e.target.value)}
            placeholder="CLOSE"
          />
        </div>
      </Dialog>
    </div>
  );
}

function DocumentsTab({ phaseId, documents, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    try {
      setError('');
      await api.createDocument(phaseId, title, content);
      setTitle('');
      setContent('');
      setShowDialog(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      setError('');
      await api.updateDocument(editDoc.id, { title, content });
      setEditDoc(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError('');
      await api.deleteDocument(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (doc: any) => {
    setEditDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={() => setShowDialog(true)}>New Document</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {documents.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">No documents yet.</div>
        </div>
      )}

      {documents.map((doc: any) => (
        <div key={doc.id} className="card">
          <div className="card-header">
            <div className="card-title">{doc.title}</div>
          </div>
          {doc.content && <div className="card-content">{doc.content}</div>}
          <div className="card-actions">
            <Button variant="secondary" onClick={() => openEdit(doc)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDelete(doc.id)}>
              Delete
            </Button>
          </div>
        </div>
      ))}

      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Document"
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
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <PlainTextArea value={content} onChange={setContent} />
        </div>
      </Dialog>

      <Dialog
        isOpen={!!editDoc}
        onClose={() => setEditDoc(null)}
        title="Edit Document"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!title.trim()}>
              Update
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <PlainTextArea value={content} onChange={setContent} />
        </div>
      </Dialog>
    </div>
  );
}

function DecisionsTab({ phaseId, decisions, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [editDec, setEditDec] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');
  const [lockConfirmation, setLockConfirmation] = useState('');
  const [lockingId, setLockingId] = useState('');

  const handleCreate = async () => {
    try {
      setError('');
      await api.createDecision(phaseId, title, statement, rationale);
      setTitle('');
      setStatement('');
      setRationale('');
      setShowDialog(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      setError('');
      await api.updateDecision(editDec.id, { title, statement, rationale });
      setEditDec(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLock = async () => {
    try {
      setError('');
      await api.lockDecision(lockingId, lockConfirmation);
      setLockingId('');
      setLockConfirmation('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError('');
      await api.deleteDecision(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (dec: any) => {
    setEditDec(dec);
    setTitle(dec.title);
    setStatement(dec.statement);
    setRationale(dec.rationale);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={() => setShowDialog(true)}>New Decision</Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {decisions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">No decisions yet.</div>
        </div>
      )}

      {decisions.map((dec: any) => (
        <div key={dec.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{dec.title}</div>
              <div className="card-meta">
                <StatusBadge status={dec.status} />
              </div>
            </div>
          </div>
          {dec.statement && (
            <div className="card-content">
              <strong>Statement:</strong> {dec.statement}
            </div>
          )}
          {dec.rationale && (
            <div className="card-content">
              <strong>Rationale:</strong> {dec.rationale}
            </div>
          )}
          <div className="card-actions">
            {dec.status === 'DRAFT' && (
              <>
                <Button variant="secondary" onClick={() => openEdit(dec)}>
                  Edit
                </Button>
                <Button variant="primary" onClick={() => setLockingId(dec.id)}>
                  Lock
                </Button>
                <Button variant="danger" onClick={() => handleDelete(dec.id)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Decision"
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
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Statement</label>
          <PlainTextArea value={statement} onChange={setStatement} />
        </div>
        <div className="form-group">
          <label className="form-label">Rationale</label>
          <PlainTextArea value={rationale} onChange={setRationale} />
        </div>
      </Dialog>

      <Dialog
        isOpen={!!editDec}
        onClose={() => setEditDec(null)}
        title="Edit Decision"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditDec(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!title.trim()}>
              Update
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Statement</label>
          <PlainTextArea value={statement} onChange={setStatement} />
        </div>
        <div className="form-group">
          <label className="form-label">Rationale</label>
          <PlainTextArea value={rationale} onChange={setRationale} />
        </div>
      </Dialog>

      <Dialog
        isOpen={!!lockingId}
        onClose={() => setLockingId('')}
        title="Lock Decision"
        actions={
          <>
            <Button variant="secondary" onClick={() => setLockingId('')}>
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={lockConfirmation !== 'LOCK'}>
              Lock
            </Button>
          </>
        }
      >
        <p>
          Locking makes this decision immutable. Tasks can only be created from locked decisions.
        </p>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Type "LOCK" to confirm</label>
          <input
            className="form-input"
            value={lockConfirmation}
            onChange={(e) => setLockConfirmation(e.target.value)}
            placeholder="LOCK"
          />
        </div>
      </Dialog>
    </div>
  );
}

function TasksTab({ tasks, decisions, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [decisionId, setDecisionId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const lockedDecisions = decisions.filter((d: any) => d.status === 'LOCKED');

  const handleCreate = async () => {
    try {
      setError('');
      await api.createTask(decisionId, title, description);
      setTitle('');
      setDescription('');
      setDecisionId('');
      setShowDialog(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setError('');
      await api.completeTask(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVoid = async (id: string) => {
    try {
      setError('');
      await api.voidTask(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={() => setShowDialog(true)} disabled={lockedDecisions.length === 0}>
          New Task
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-text">
            No tasks yet. Lock a decision first, then create tasks.
          </div>
        </div>
      )}

      {tasks.map((task: any) => (
        <div key={task.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{task.title}</div>
              <div className="card-meta">
                <StatusBadge status={task.status} />
              </div>
            </div>
          </div>
          {task.description && <div className="card-content">{task.description}</div>}
          <div className="card-actions">
            {task.status === 'PENDING' && (
              <>
                <Button variant="primary" onClick={() => handleComplete(task.id)}>
                  Complete
                </Button>
                <Button variant="secondary" onClick={() => handleVoid(task.id)}>
                  Void
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Task"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!decisionId || !title.trim()}>
              Create
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Decision (locked)</label>
          <select
            className="form-input"
            value={decisionId}
            onChange={(e) => setDecisionId(e.target.value)}
          >
            <option value="">Select a decision</option>
            {lockedDecisions.map((dec: any) => (
              <option key={dec.id} value={dec.id}>
                {dec.title}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <PlainTextArea value={description} onChange={setDescription} />
        </div>
      </Dialog>
    </div>
  );
}
