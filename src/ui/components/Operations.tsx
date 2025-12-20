import { useState, useEffect } from 'react';
import { api } from '../api-client';
import { Button } from './shared/Button';
import { Dialog } from './shared/Dialog';

export function Operations() {
  const [backups, setBackups] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [restoreConfirmation, setRestoreConfirmation] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = (await api.listBackups()) as any[];
      setBackups(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBackup = async () => {
    try {
      setError('');
      setSuccess('');
      await api.createBackup();
      setSuccess('Backup created successfully');
      loadBackups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestore = async () => {
    try {
      setError('');
      setSuccess('');
      await api.restore(selectedBackup, restoreConfirmation);
      setSuccess('Database restored successfully');
      setShowRestoreDialog(false);
      setRestoreConfirmation('');
      setSelectedBackup('');
      loadBackups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    try {
      setError('');
      setSuccess('');
      const result: any = await api.export();
      setSuccess(`Exported to ${result.file}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openRestore = (backupFile: string) => {
    setSelectedBackup(backupFile);
    setShowRestoreDialog(true);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Operations</h2>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div
          style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          {success}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Backup & Restore</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button onClick={handleBackup}>Create Backup</Button>
        </div>

        {backups.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No backups available.</p>
        )}

        {backups.map((backup: any) => (
          <div
            key={backup.file}
            style={{
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {backup.file.split('/').pop()}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(backup.timestamp).toLocaleString()} • {(backup.size / 1024).toFixed(2)}{' '}
                  KB
                </div>
              </div>
              <Button variant="secondary" onClick={() => openRestore(backup.file)}>
                Restore
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Export</h3>
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
          Export all data to JSON format.
        </p>
        <Button onClick={handleExport}>Export Data</Button>
      </div>

      <Dialog
        isOpen={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        title="Restore from Backup"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRestore}
              disabled={restoreConfirmation !== 'RESTORE'}
            >
              Restore
            </Button>
          </>
        }
      >
        <p>
          This will replace the current database with the backup. All unsaved changes will be lost.
        </p>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Type "RESTORE" to confirm</label>
          <input
            className="form-input"
            value={restoreConfirmation}
            onChange={(e) => setRestoreConfirmation(e.target.value)}
            placeholder="RESTORE"
          />
        </div>
      </Dialog>
    </div>
  );
}
