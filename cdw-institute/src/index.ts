// Main entry point - wires everything together

import { Table } from './zones/Table.js';
import { SideDesk } from './zones/SideDesk.js';
import { ReadingChair } from './zones/ReadingChair.js';
import { Shelves } from './zones/Shelves.js';
import { TransitionManager } from './zones/TransitionManager.js';
import { FileRepository } from './storage/FileRepository.js';
import { JudgmentService } from './core/JudgmentService.js';
import { ConstraintEnforcer } from './core/ConstraintEnforcer.js';
import { AuditLog } from './core/AuditLog.js';
import { Workspace } from './ui/Workspace.js';

export class CDWInstitute {
  private workspace: Workspace;
  private judgmentService: JudgmentService;
  private constraintEnforcer: ConstraintEnforcer;
  private auditLog: AuditLog;
  private repository: FileRepository;

  constructor(storagePath: string) {
    // Initialize repository
    this.repository = new FileRepository(storagePath);

    // Initialize workspace
    this.workspace = new Workspace(this.repository);

    // Initialize services
    this.judgmentService = new JudgmentService(
      this.workspace.getTable(),
      this.repository
    );
    this.constraintEnforcer = new ConstraintEnforcer();
    this.auditLog = new AuditLog();
  }

  // Initialize all components
  async initialize(): Promise<void> {
    await this.repository.initialize();

    // Log system initialization
    this.auditLog.logAction({
      timestamp: new Date(),
      action: 'SYSTEM_INITIALIZED',
      zone: null,
      itemId: null,
      researcherNote: 'CDW Institute system started',
      constraintViolation: null,
    });
  }

  // Start the UI
  start(): void {
    // This would be called by the UI layer
    console.log('CDW Institute started');
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    // Log system shutdown
    this.auditLog.logAction({
      timestamp: new Date(),
      action: 'SYSTEM_SHUTDOWN',
      zone: null,
      itemId: null,
      researcherNote: 'CDW Institute system stopped',
      constraintViolation: null,
    });

    console.log('CDW Institute shut down');
  }

  // Getters for external access
  getWorkspace(): Workspace {
    return this.workspace;
  }

  getJudgmentService(): JudgmentService {
    return this.judgmentService;
  }

  getConstraintEnforcer(): ConstraintEnforcer {
    return this.constraintEnforcer;
  }

  getAuditLog(): AuditLog {
    return this.auditLog;
  }

  getRepository(): FileRepository {
    return this.repository;
  }
}

// Export for use
export { CDWInstitute as default };
