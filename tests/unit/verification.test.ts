/**
 * Unit Tests for Hash Verification
 * Section 4.1: S1 requires minimum 10 test cases for verification.test.ts
 *
 * Tests hash verification per Section 0.5.5
 * "Verification failure: Hard stop, no recovery, require operator intervention"
 */

import { describe, it, expect } from 'vitest';
import {
  HashVerificationError,
  verifyHash,
  verifyHashOrThrow,
  verifyPhaseHash,
  verifyPhaseHashOrThrow,
  verifyDecisionHash,
  verifyDecisionHashOrThrow,
  verifyTaskHash,
  verifyTaskHashOrThrow,
  verifyDocumentHash,
  verifyDocumentHashOrThrow,
  allVerificationsValid,
  getFailedVerifications,
} from '../../src/core/verification.js';
import {
  computePhaseHash,
  computeDecisionHash,
  computeTaskHash,
  computeDocumentHash,
} from '../../src/core/hash.js';
import type { Phase, Decision, Task, Document } from '../../src/core/types.js';

describe('Hash Verification', () => {
  // TEST 1: Successful hash verification
  it('should return valid result when hashes match', () => {
    const hash = 'v1:abc123';
    const result = verifyHash(hash, hash, 'TestEntity', 'test-id');

    expect(result.valid).toBe(true);
    expect(result.expected).toBe(hash);
    expect(result.actual).toBe(hash);
  });

  // TEST 2: Failed hash verification
  it('should return invalid result when hashes do not match', () => {
    const expected = 'v1:abc123';
    const actual = 'v1:def456';
    const result = verifyHash(actual, expected, 'TestEntity', 'test-id');

    expect(result.valid).toBe(false);
    expect(result.expected).toBe(expected);
    expect(result.actual).toBe(actual);
    expect(result.message).toContain('Hash mismatch');
  });

  // TEST 3: Hard stop on verification failure
  it('should throw HashVerificationError when hashes do not match', () => {
    const expected = 'v1:abc123';
    const actual = 'v1:def456';

    expect(() => {
      verifyHashOrThrow(actual, expected, 'TestEntity', 'test-id');
    }).toThrow(HashVerificationError);
  });

  // TEST 4: HashVerificationError structure
  it('should create HashVerificationError with correct properties', () => {
    const expected = 'v1:abc123';
    const actual = 'v1:def456';
    const error = new HashVerificationError('Phase', 'phase-123', expected, actual);

    expect(error.name).toBe('HashVerificationError');
    expect(error.entityType).toBe('Phase');
    expect(error.entityId).toBe('phase-123');
    expect(error.expected).toBe(expected);
    expect(error.actual).toBe(actual);
    expect(error.message).toContain('HARD STOP');
    expect(error.message).toContain('Operator intervention required');
  });

  // TEST 5: Phase hash verification success
  it('should verify Phase hash successfully', () => {
    const phase: Phase = {
      id: 'phase-123',
      name: 'Test Phase',
      description: 'Description',
      status: 'ACTIVE',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: computePhaseHash('phase-123', 'Test Phase', 'Description'),
    };

    const result = verifyPhaseHash(phase);
    expect(result.valid).toBe(true);
  });

  // TEST 6: Phase hash verification failure
  it('should detect Phase hash mismatch', () => {
    const phase: Phase = {
      id: 'phase-123',
      name: 'Test Phase',
      description: 'Description',
      status: 'ACTIVE',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: 'v1:wronghash',
    };

    const result = verifyPhaseHash(phase);
    expect(result.valid).toBe(false);
  });

  // TEST 7: Phase hash verification hard stop
  it('should throw on Phase hash mismatch when using OrThrow', () => {
    const phase: Phase = {
      id: 'phase-123',
      name: 'Test Phase',
      description: 'Description',
      status: 'ACTIVE',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: 'v1:wronghash',
    };

    expect(() => {
      verifyPhaseHashOrThrow(phase);
    }).toThrow(HashVerificationError);
  });

  // TEST 8: Decision hash verification success
  it('should verify Decision hash successfully', () => {
    const decision: Decision = {
      id: 'decision-123',
      phase_id: 'phase-123',
      content: 'Decision content',
      status: 'DRAFT',
      created_at: '2025-12-20T00:00:00Z',
      locked_at: null,
      content_hash: computeDecisionHash('phase-123', 'Decision content'),
    };

    const result = verifyDecisionHash(decision);
    expect(result.valid).toBe(true);
  });

  // TEST 9: Decision hash verification failure
  it('should throw on Decision hash mismatch', () => {
    const decision: Decision = {
      id: 'decision-123',
      phase_id: 'phase-123',
      content: 'Decision content',
      status: 'DRAFT',
      created_at: '2025-12-20T00:00:00Z',
      locked_at: null,
      content_hash: 'v1:wronghash',
    };

    expect(() => {
      verifyDecisionHashOrThrow(decision);
    }).toThrow(HashVerificationError);
  });

  // TEST 10: Task hash verification success
  it('should verify Task hash successfully', () => {
    const task: Task = {
      id: 'task-123',
      decision_id: 'decision-123',
      title: 'Task title',
      description: 'Task description',
      status: 'PENDING',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: computeTaskHash('decision-123', 'Task title', 'Task description'),
    };

    const result = verifyTaskHash(task);
    expect(result.valid).toBe(true);
  });

  // TEST 11: Task hash verification failure
  it('should throw on Task hash mismatch', () => {
    const task: Task = {
      id: 'task-123',
      decision_id: 'decision-123',
      title: 'Task title',
      description: 'Task description',
      status: 'PENDING',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: 'v1:wronghash',
    };

    expect(() => {
      verifyTaskHashOrThrow(task);
    }).toThrow(HashVerificationError);
  });

  // TEST 12: Document hash verification success
  it('should verify Document hash successfully', () => {
    const document: Document = {
      id: 'doc-123',
      phase_id: 'phase-123',
      title: 'Document title',
      content: 'Plain text content',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: computeDocumentHash('phase-123', 'Document title', 'Plain text content'),
    };

    const result = verifyDocumentHash(document);
    expect(result.valid).toBe(true);
  });

  // TEST 13: Document hash verification failure
  it('should throw on Document hash mismatch', () => {
    const document: Document = {
      id: 'doc-123',
      phase_id: 'phase-123',
      title: 'Document title',
      content: 'Plain text content',
      created_at: '2025-12-20T00:00:00Z',
      updated_at: '2025-12-20T00:00:00Z',
      content_hash: 'v1:wronghash',
    };

    expect(() => {
      verifyDocumentHashOrThrow(document);
    }).toThrow(HashVerificationError);
  });

  // TEST 14: Batch verification with all valid results
  it('should return true when all batch verifications valid', () => {
    const results = [
      { valid: true, expected: 'hash1', actual: 'hash1' },
      { valid: true, expected: 'hash2', actual: 'hash2' },
      { valid: true, expected: 'hash3', actual: 'hash3' },
    ];

    expect(allVerificationsValid(results)).toBe(true);
  });

  // TEST 15: Batch verification with some failures
  it('should return false when any batch verification fails', () => {
    const results = [
      { valid: true, expected: 'hash1', actual: 'hash1' },
      { valid: false, expected: 'hash2', actual: 'wrong2' },
      { valid: true, expected: 'hash3', actual: 'hash3' },
    ];

    expect(allVerificationsValid(results)).toBe(false);
  });

  // TEST 16: Get failed verifications from batch
  it('should filter failed verifications from batch results', () => {
    const results = [
      { valid: true, expected: 'hash1', actual: 'hash1' },
      { valid: false, expected: 'hash2', actual: 'wrong2' },
      { valid: false, expected: 'hash3', actual: 'wrong3' },
      { valid: true, expected: 'hash4', actual: 'hash4' },
    ];

    const failed = getFailedVerifications(results);
    expect(failed).toHaveLength(2);
    expect(failed[0].valid).toBe(false);
    expect(failed[1].valid).toBe(false);
  });
});
