import { describe, it, expect } from 'vitest';
import {
  computeDecisionHash,
  computeSnapshotHash,
  verifyDecisionHash,
  verifySnapshotHash,
} from '../../src/persistence/hash-utils.js';

describe('Hash Utils', () => {
  describe('Decision Hash', () => {
    it('computes consistent hash', () => {
      const hash1 = computeDecisionHash('Title', 'Statement', 'Rationale');
      const hash2 = computeDecisionHash('Title', 'Statement', 'Rationale');
      expect(hash1).toBe(hash2);
    });

    it('uses v1: prefix', () => {
      const hash = computeDecisionHash('Title', 'Statement', 'Rationale');
      expect(hash.startsWith('v1:')).toBe(true);
    });

    it('produces different hashes for different content', () => {
      const hash1 = computeDecisionHash('Title1', 'Statement', 'Rationale');
      const hash2 = computeDecisionHash('Title2', 'Statement', 'Rationale');
      expect(hash1).not.toBe(hash2);
    });

    it('normalizes line endings', () => {
      const hash1 = computeDecisionHash('Title\nLine2', 'Statement', 'Rationale');
      const hash2 = computeDecisionHash('Title\r\nLine2', 'Statement', 'Rationale');
      expect(hash1).toBe(hash2);
    });

    it('verifies correct hash', () => {
      const hash = computeDecisionHash('Title', 'Statement', 'Rationale');
      expect(verifyDecisionHash('Title', 'Statement', 'Rationale', hash)).toBe(true);
    });

    it('rejects incorrect hash', () => {
      const hash = computeDecisionHash('Title', 'Statement', 'Rationale');
      expect(verifyDecisionHash('DifferentTitle', 'Statement', 'Rationale', hash)).toBe(false);
    });
  });

  describe('Snapshot Hash', () => {
    it('computes consistent hash', () => {
      const hash1 = computeSnapshotHash('Title', 'Content');
      const hash2 = computeSnapshotHash('Title', 'Content');
      expect(hash1).toBe(hash2);
    });

    it('uses v1: prefix', () => {
      const hash = computeSnapshotHash('Title', 'Content');
      expect(hash.startsWith('v1:')).toBe(true);
    });

    it('produces different hashes for different content', () => {
      const hash1 = computeSnapshotHash('Title', 'Content1');
      const hash2 = computeSnapshotHash('Title', 'Content2');
      expect(hash1).not.toBe(hash2);
    });

    it('verifies correct hash', () => {
      const hash = computeSnapshotHash('Title', 'Content');
      expect(verifySnapshotHash('Title', 'Content', hash)).toBe(true);
    });

    it('rejects incorrect hash', () => {
      const hash = computeSnapshotHash('Title', 'Content');
      expect(verifySnapshotHash('Title', 'DifferentContent', hash)).toBe(false);
    });
  });
});
