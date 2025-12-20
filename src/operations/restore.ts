import fs from 'fs';
import { config } from '../config.js';
import { closeDatabase, initDatabase } from '../persistence/database.js';

/**
 * Restores database from a backup file.
 */

export function restoreFromBackup(backupFile: string): { success: boolean } {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  // Close current database connection
  closeDatabase();

  // Backup current database if it exists
  if (fs.existsSync(config.databasePath)) {
    const tempBackup = config.databasePath + '.pre-restore';
    fs.copyFileSync(config.databasePath, tempBackup);
  }

  // Restore from backup
  fs.copyFileSync(backupFile, config.databasePath);

  // Reinitialize database connection
  initDatabase();

  return { success: true };
}
