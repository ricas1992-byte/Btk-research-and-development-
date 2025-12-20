import fs from 'fs';
import path from 'path';
import { getDatabase } from '../persistence/database.js';
import { Gateway } from '../persistence/gateway.js';
import { config } from '../config.js';
import { ExportInfo } from '../types/entities.js';

/**
 * Exports all data to a JSON file.
 */

export function exportData(): ExportInfo {
  const db = getDatabase();
  const gateway = new Gateway(db);

  // Ensure export directory exists
  if (!fs.existsSync(config.exportDir)) {
    fs.mkdirSync(config.exportDir, { recursive: true });
  }

  // Gather all data
  const project = gateway.getProject();
  const ideas = gateway.getIdeas();
  const phases = gateway.getPhases();
  const documents = gateway.getDocuments();
  const decisions = gateway.getDecisions();
  const tasks = gateway.getTasks();
  const auditLog = gateway.getAuditLog(1000);

  // Gather snapshots for all phases
  const allSnapshots = phases.flatMap((phase) => gateway.getSnapshots(phase.id));

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project,
    ideas,
    phases,
    documents,
    decisions,
    tasks,
    snapshots: allSnapshots,
    auditLog,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFile = path.join(config.exportDir, `cdw-export-${timestamp}.json`);

  fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2), 'utf8');

  return {
    file: exportFile,
    stats: {
      ideas: ideas.length,
      phases: phases.length,
      decisions: decisions.length,
      tasks: tasks.length,
      documents: documents.length,
      snapshots: allSnapshots.length,
    },
  };
}
