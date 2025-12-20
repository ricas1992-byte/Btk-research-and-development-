/**
 * Unit Tests for Hash Utilities
 * Section 4.1: S1 requires minimum 10 test cases for hash.test.ts
 *
 * Tests SHA-256 hash computation per Section 0.5.5
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  computeHash,
  computeHashFromFields,
  computePhaseHash,
  computeDecisionHash,
  computeTaskHash,
  computeDocumentHash,
  computeParkingLotHash,
  extractHashValue,
  extractHashVersion,
  getHashResult,
} from '../../src/core/hash.js';

describe('Hash Utilities', () => {
  // TEST 1: Text normalization
  it('should normalize CRLF to LF', () => {
    const input = 'line1\r\nline2\r\nline3';
    const normalized = normalizeText(input);
    expect(normalized).toBe('line1\nline2\nline3');
  });

  // TEST 2: Text normalization trimming
  it('should trim whitespace from text', () => {
    const input = '  content with spaces  ';
    const normalized = normalizeText(input);
    expect(normalized).toBe('content with spaces');
  });

  // TEST 3: Basic hash computation
  it('should compute SHA-256 hash with version prefix', () => {
    const content = 'test content';
    const hash = computeHash(content);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);
  });

  // TEST 4: Hash determinism
  it('should produce identical hashes for identical content', () => {
    const content = 'deterministic content';
    const hash1 = computeHash(content);
    const hash2 = computeHash(content);
    expect(hash1).toBe(hash2);
  });

  // TEST 5: Hash uniqueness
  it('should produce different hashes for different content', () => {
    const hash1 = computeHash('content A');
    const hash2 = computeHash('content B');
    expect(hash1).not.toBe(hash2);
  });

  // TEST 6: Multi-field hash with null byte separator
  it('should compute hash from multiple fields with null separator', () => {
    const fields = ['field1', 'field2', 'field3'];
    const hash = computeHashFromFields(fields);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);

    // Verify null byte prevents collision
    const collision = computeHash('field1field2field3');
    expect(hash).not.toBe(collision);
  });

  // TEST 7: Phase hash computation
  it('should compute Phase entity hash correctly', () => {
    const id = 'phase-123';
    const name = 'Test Phase';
    const description = 'Phase description';

    const hash = computePhaseHash(id, name, description);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);

    // Verify determinism
    const hash2 = computePhaseHash(id, name, description);
    expect(hash).toBe(hash2);
  });

  // TEST 8: Decision hash computation with parent chain
  it('should compute Decision entity hash with parent phase_id', () => {
    const phaseId = 'phase-123';
    const content = 'Decision content';

    const hash = computeDecisionHash(phaseId, content);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);

    // Verify parent is included in hash
    const differentPhaseHash = computeDecisionHash('phase-456', content);
    expect(hash).not.toBe(differentPhaseHash);
  });

  // TEST 9: Task hash computation
  it('should compute Task entity hash correctly', () => {
    const decisionId = 'decision-123';
    const title = 'Task title';
    const description = 'Task description';

    const hash = computeTaskHash(decisionId, title, description);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);
  });

  // TEST 10: Document hash computation
  it('should compute Document entity hash correctly', () => {
    const phaseId = 'phase-123';
    const title = 'Document title';
    const content = 'Document plain text content';

    const hash = computeDocumentHash(phaseId, title, content);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);
  });

  // TEST 11: ParkingLot hash with optional source_phase_id
  it('should compute ParkingLot hash with and without source_phase_id', () => {
    const content = 'Parking lot idea';

    const hashWithoutSource = computeParkingLotHash(content, null);
    const hashWithSource = computeParkingLotHash(content, 'phase-123');

    expect(hashWithoutSource).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(hashWithSource).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(hashWithoutSource).not.toBe(hashWithSource);
  });

  // TEST 12: Hash value extraction
  it('should extract hash value without version prefix', () => {
    const hash = 'v1:abcdef1234567890';
    const value = extractHashValue(hash);
    expect(value).toBe('abcdef1234567890');
  });

  // TEST 13: Hash version extraction
  it('should extract hash version from versioned hash', () => {
    const hash = 'v1:abcdef1234567890';
    const version = extractHashVersion(hash);
    expect(version).toBe('v1');
  });

  // TEST 14: Hash result with metadata
  it('should return HashResult with algorithm and version', () => {
    const content = 'test content';
    const result = getHashResult(content);

    expect(result.hash).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(result.algorithm).toBe('SHA-256');
    expect(result.version).toBe('v1');
  });

  // TEST 15: Empty content hashing
  it('should handle empty content correctly', () => {
    const hash = computeHash('');
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);
  });

  // TEST 16: Unicode content hashing
  it('should handle Unicode content correctly', () => {
    const content = '日本語テキスト 🎯';
    const hash = computeHash(content);
    expect(hash).toMatch(/^v1:[a-f0-9]{64}$/);

    // Verify determinism with Unicode
    const hash2 = computeHash(content);
    expect(hash).toBe(hash2);
  });
});
