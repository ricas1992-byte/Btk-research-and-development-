import { Router } from 'express';
import { getDatabase } from '../../persistence/database.js';
import { Gateway } from '../../persistence/gateway.js';
import { createBackup, listBackups } from '../../operations/backup.js';
import { restoreFromBackup } from '../../operations/restore.js';
import { exportData } from '../../operations/export.js';
import { validateConfirmation } from '../../core/state-validator.js';

export const opsRouter = Router();

// POST /api/ops/backup
opsRouter.post('/backup', (_req, res, next) => {
  try {
    const backupInfo = createBackup();
    res.json(backupInfo);
  } catch (error) {
    next(error);
  }
});

// GET /api/ops/backups
opsRouter.get('/backups', (_req, res, next) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (error) {
    next(error);
  }
});

// POST /api/ops/restore
opsRouter.post('/restore', (req, res, next) => {
  try {
    const { backupFile, confirmation } = req.body;

    validateConfirmation(confirmation, 'RESTORE', 'restore from backup');

    const result = restoreFromBackup(backupFile);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/ops/export
opsRouter.post('/export', (_req, res, next) => {
  try {
    const exportInfo = exportData();
    res.json(exportInfo);
  } catch (error) {
    next(error);
  }
});

// GET /api/ops/audit-log?limit=100&offset=0
opsRouter.get('/audit-log', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const db = getDatabase();
    const gateway = new Gateway(db);
    const auditLog = gateway.getAuditLog(limit, offset);
    res.json(auditLog);
  } catch (error) {
    next(error);
  }
});
