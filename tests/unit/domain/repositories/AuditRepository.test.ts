/**
 * AuditRepository Tests
 * S3: State Machine & Enforcement Layer
 * Tests audit log persistence and querying
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { AuditRepository } from '../../../../src/domain/repositories/AuditRepository.js';
import { AuditLog } from '../../../../src/domain/entities/AuditLog.js';
import fs from 'fs';
import path from 'path';

describe('AuditRepository', () => {
  let db: Database.Database;
  let repository: AuditRepository;

  beforeEach(() => {
    // Create in-memory database
    db = new Database(':memory:');

    // Load audit_log migration
    const auditMigrationPath = path.join(
      process.cwd(),
      'src',
      'db',
      'migrations',
      '002_audit_log.sql'
    );
    const auditMigration = fs.readFileSync(auditMigrationPath, 'utf-8');
    db.exec(auditMigration);

    repository = new AuditRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create audit log entry', () => {
      const auditLog = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'test-phase-id',
        action: 'PHASE_CREATED',
        metadata: { name: 'Test Phase' },
      });

      const created = repository.create(auditLog);

      expect(created.id).toBe(auditLog.id);
      expect(created.entity_type).toBe('Phase');
      expect(created.action).toBe('PHASE_CREATED');
    });

    it('should persist audit log to database', () => {
      const auditLog = AuditLog.create({
        entity_type: 'Decision',
        entity_id: 'test-decision-id',
        action: 'DECISION_LOCKED',
        old_state: 'DRAFT',
        new_state: 'LOCKED',
      });

      repository.create(auditLog);

      const retrieved = repository.findById(auditLog.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(auditLog.id);
      expect(retrieved!.old_state).toBe('DRAFT');
      expect(retrieved!.new_state).toBe('LOCKED');
    });
  });

  describe('findById', () => {
    it('should return audit log entry by id', () => {
      const auditLog = AuditLog.create({
        entity_type: 'Task',
        entity_id: 'test-task-id',
        action: 'TASK_COMPLETED',
      });

      repository.create(auditLog);

      const retrieved = repository.findById(auditLog.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(auditLog.id);
    });

    it('should return null when audit log not found', () => {
      const retrieved = repository.findById('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('findByEntity', () => {
    it('should return all audit logs for specific entity', () => {
      const phase1 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_CREATED',
      });

      const phase1Update = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_UPDATED',
      });

      const phase2 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-2',
        action: 'PHASE_CREATED',
      });

      repository.create(phase1);
      repository.create(phase1Update);
      repository.create(phase2);

      const logs = repository.findByEntity('Phase', 'phase-1');

      expect(logs).toHaveLength(2);
      expect(logs[0].entity_id).toBe('phase-1');
      expect(logs[1].entity_id).toBe('phase-1');
    });

    it('should return empty array when no logs found', () => {
      const logs = repository.findByEntity('Phase', 'non-existent');
      expect(logs).toEqual([]);
    });

    it('should return logs in chronological order', () => {
      const log1 = AuditLog.create({
        entity_type: 'Decision',
        entity_id: 'decision-1',
        action: 'DECISION_CREATED',
      });

      const log2 = AuditLog.create({
        entity_type: 'Decision',
        entity_id: 'decision-1',
        action: 'DECISION_UPDATED',
      });

      const log3 = AuditLog.create({
        entity_type: 'Decision',
        entity_id: 'decision-1',
        action: 'DECISION_LOCKED',
      });

      repository.create(log1);
      repository.create(log2);
      repository.create(log3);

      const logs = repository.findByEntity('Decision', 'decision-1');

      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe('DECISION_CREATED');
      expect(logs[1].action).toBe('DECISION_UPDATED');
      expect(logs[2].action).toBe('DECISION_LOCKED');
    });
  });

  describe('findByAction', () => {
    it('should return all audit logs for specific action', () => {
      const phase1 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_CREATED',
      });

      const phase2 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-2',
        action: 'PHASE_CREATED',
      });

      const phaseUpdate = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_UPDATED',
      });

      repository.create(phase1);
      repository.create(phase2);
      repository.create(phaseUpdate);

      const logs = repository.findByAction('PHASE_CREATED');

      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('PHASE_CREATED');
      expect(logs[1].action).toBe('PHASE_CREATED');
    });

    it('should return empty array when no logs found', () => {
      const logs = repository.findByAction('NON_EXISTENT_ACTION');
      expect(logs).toEqual([]);
    });
  });

  describe('findByTimeRange', () => {
    it('should return audit logs within time range', () => {
      const log1 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_CREATED',
      });

      // Small delay to ensure different timestamps
      const log2 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-2',
        action: 'PHASE_CREATED',
      });

      repository.create(log1);
      repository.create(log2);

      const start = log1.created_at;
      const end = log2.created_at;

      const logs = repository.findByTimeRange(start, end);

      expect(logs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findAll', () => {
    it('should return all audit log entries', () => {
      const log1 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_CREATED',
      });

      const log2 = AuditLog.create({
        entity_type: 'Decision',
        entity_id: 'decision-1',
        action: 'DECISION_CREATED',
      });

      const log3 = AuditLog.create({
        entity_type: 'Task',
        entity_id: 'task-1',
        action: 'TASK_CREATED',
      });

      repository.create(log1);
      repository.create(log2);
      repository.create(log3);

      const logs = repository.findAll();

      expect(logs).toHaveLength(3);
    });

    it('should return empty array when no logs exist', () => {
      const logs = repository.findAll();
      expect(logs).toEqual([]);
    });

    it('should return logs in chronological order', () => {
      const log1 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_CREATED',
      });

      const log2 = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'phase-1',
        action: 'PHASE_UPDATED',
      });

      repository.create(log1);
      repository.create(log2);

      const logs = repository.findAll();

      expect(logs[0].created_at <= logs[1].created_at).toBe(true);
    });
  });

  describe('count', () => {
    it('should return total count of audit logs', () => {
      expect(repository.count()).toBe(0);

      repository.create(
        AuditLog.create({
          entity_type: 'Phase',
          entity_id: 'phase-1',
          action: 'PHASE_CREATED',
        })
      );

      expect(repository.count()).toBe(1);

      repository.create(
        AuditLog.create({
          entity_type: 'Phase',
          entity_id: 'phase-2',
          action: 'PHASE_CREATED',
        })
      );

      expect(repository.count()).toBe(2);
    });
  });

  describe('countByEntity', () => {
    it('should return count of audit logs for specific entity', () => {
      repository.create(
        AuditLog.create({
          entity_type: 'Phase',
          entity_id: 'phase-1',
          action: 'PHASE_CREATED',
        })
      );

      repository.create(
        AuditLog.create({
          entity_type: 'Phase',
          entity_id: 'phase-1',
          action: 'PHASE_UPDATED',
        })
      );

      repository.create(
        AuditLog.create({
          entity_type: 'Phase',
          entity_id: 'phase-2',
          action: 'PHASE_CREATED',
        })
      );

      expect(repository.countByEntity('Phase', 'phase-1')).toBe(2);
      expect(repository.countByEntity('Phase', 'phase-2')).toBe(1);
      expect(repository.countByEntity('Phase', 'phase-3')).toBe(0);
    });
  });

  describe('Metadata handling', () => {
    it('should store and retrieve metadata as JSON', () => {
      const metadata = {
        rule: 'ENF-01',
        reason: 'Test violation',
        details: { foo: 'bar' },
      };

      const auditLog = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'test-id',
        action: 'ENFORCEMENT_VIOLATION',
        metadata,
      });

      repository.create(auditLog);

      const retrieved = repository.findById(auditLog.id);
      const retrievedMetadata = retrieved!.getMetadata();

      expect(retrievedMetadata).toEqual(metadata);
    });

    it('should handle null metadata', () => {
      const auditLog = AuditLog.create({
        entity_type: 'Phase',
        entity_id: 'test-id',
        action: 'PHASE_CREATED',
        metadata: null,
      });

      repository.create(auditLog);

      const retrieved = repository.findById(auditLog.id);
      expect(retrieved!.getMetadata()).toBeNull();
    });
  });

  describe('Append-only enforcement', () => {
    it('should not have update method', () => {
      expect((repository as any).update).toBeUndefined();
    });

    it('should not have delete method', () => {
      expect((repository as any).delete).toBeUndefined();
    });
  });
});
