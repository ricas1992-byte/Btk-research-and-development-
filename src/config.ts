import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databasePath: process.env.DB_PATH || path.join(__dirname, '../data/cdw.db'),
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../data/backups'),
  exportDir: process.env.EXPORT_DIR || path.join(__dirname, '../data/exports'),
};
