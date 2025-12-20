import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';
import { BackupInfo } from '../types/entities.js';

/**
 * Creates a backup of the database.
 */

export function createBackup(dbPath: string = config.databasePath): BackupInfo {
  // Ensure backup directory exists
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(config.backupDir, `cdw-backup-${timestamp}.db`);

  // Copy database file
  fs.copyFileSync(dbPath, backupFile);

  // Compute checksum
  const fileBuffer = fs.readFileSync(backupFile);
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const size = fs.statSync(backupFile).size;

  return {
    file: backupFile,
    checksum: `v1:${checksum}`,
    timestamp: new Date().toISOString(),
    size,
  };
}

export function listBackups(): BackupInfo[] {
  if (!fs.existsSync(config.backupDir)) {
    return [];
  }

  const files = fs.readdirSync(config.backupDir).filter((f) => f.endsWith('.db'));

  return files
    .map((file) => {
      const filePath = path.join(config.backupDir, file);
      const stats = fs.statSync(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      return {
        file: filePath,
        checksum: `v1:${checksum}`,
        timestamp: stats.mtime.toISOString(),
        size: stats.size,
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
