/**
 * Hash Verification Functions for CDW
 * Section 0.5.5: Hash Verification Protocol
 *
 * Timing: Computed on create, verified on read, recomputed on update
 * Verification failure: Hard stop, no recovery, require operator intervention
 */

import {
  computePhaseHash,
  computeDecisionHash,
  computeTaskHash,
  computeDocumentHash,
  computeParkingLotHash,
} from './hash.js';
import type { VerificationResult, Phase, Decision, Task, Document, ParkingLot } from './types.js';

/**
 * Verification error thrown on hash mismatch
 *
 * Per Section 0.5.5: "Verification failure: Hard stop, no recovery"
 */
export class HashVerificationError extends Error {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly expected: string,
    public readonly actual: string
  ) {
    super(
      `Hash verification failed for ${entityType} ${entityId}. ` +
        `Expected: ${expected}, Actual: ${actual}. ` +
        `HARD STOP: Data integrity compromised. Operator intervention required.`
    );
    this.name = 'HashVerificationError';
  }
}

/**
 * Verify hash matches expected value
 *
 * @param actual - Computed hash
 * @param expected - Expected hash from storage
 * @param entityType - Entity type for error reporting
 * @param entityId - Entity ID for error reporting
 * @returns VerificationResult
 */
export function verifyHash(
  actual: string,
  expected: string,
  entityType: string,
  entityId: string
): VerificationResult {
  const valid = actual === expected;

  if (!valid) {
    return {
      valid: false,
      expected,
      actual,
      message: `Hash mismatch for ${entityType} ${entityId}`,
    };
  }

  return {
    valid: true,
    expected,
    actual,
  };
}

/**
 * Verify hash with hard stop on failure
 *
 * Per Section 0.5.5: Throws HashVerificationError on mismatch
 *
 * @param actual - Computed hash
 * @param expected - Expected hash from storage
 * @param entityType - Entity type for error reporting
 * @param entityId - Entity ID for error reporting
 * @throws HashVerificationError if hashes don't match
 */
export function verifyHashOrThrow(
  actual: string,
  expected: string,
  entityType: string,
  entityId: string
): void {
  if (actual !== expected) {
    throw new HashVerificationError(entityType, entityId, expected, actual);
  }
}

/**
 * Verify Phase entity hash
 *
 * @param phase - Phase entity to verify
 * @returns VerificationResult
 */
export function verifyPhaseHash(phase: Phase): VerificationResult {
  const actual = computePhaseHash(phase.id, phase.name, phase.description);
  return verifyHash(actual, phase.content_hash, 'Phase', phase.id);
}

/**
 * Verify Phase entity hash with hard stop
 *
 * @param phase - Phase entity to verify
 * @throws HashVerificationError if verification fails
 */
export function verifyPhaseHashOrThrow(phase: Phase): void {
  const actual = computePhaseHash(phase.id, phase.name, phase.description);
  verifyHashOrThrow(actual, phase.content_hash, 'Phase', phase.id);
}

/**
 * Verify Decision entity hash
 *
 * @param decision - Decision entity to verify
 * @returns VerificationResult
 */
export function verifyDecisionHash(decision: Decision): VerificationResult {
  const actual = computeDecisionHash(decision.phase_id, decision.content);
  return verifyHash(actual, decision.content_hash, 'Decision', decision.id);
}

/**
 * Verify Decision entity hash with hard stop
 *
 * @param decision - Decision entity to verify
 * @throws HashVerificationError if verification fails
 */
export function verifyDecisionHashOrThrow(decision: Decision): void {
  const actual = computeDecisionHash(decision.phase_id, decision.content);
  verifyHashOrThrow(actual, decision.content_hash, 'Decision', decision.id);
}

/**
 * Verify Task entity hash
 *
 * @param task - Task entity to verify
 * @returns VerificationResult
 */
export function verifyTaskHash(task: Task): VerificationResult {
  const actual = computeTaskHash(task.decision_id, task.title, task.description);
  return verifyHash(actual, task.content_hash, 'Task', task.id);
}

/**
 * Verify Task entity hash with hard stop
 *
 * @param task - Task entity to verify
 * @throws HashVerificationError if verification fails
 */
export function verifyTaskHashOrThrow(task: Task): void {
  const actual = computeTaskHash(task.decision_id, task.title, task.description);
  verifyHashOrThrow(actual, task.content_hash, 'Task', task.id);
}

/**
 * Verify Document entity hash
 *
 * @param document - Document entity to verify
 * @returns VerificationResult
 */
export function verifyDocumentHash(document: Document): VerificationResult {
  const actual = computeDocumentHash(document.phase_id, document.title, document.content);
  return verifyHash(actual, document.content_hash, 'Document', document.id);
}

/**
 * Verify Document entity hash with hard stop
 *
 * @param document - Document entity to verify
 * @throws HashVerificationError if verification fails
 */
export function verifyDocumentHashOrThrow(document: Document): void {
  const actual = computeDocumentHash(document.phase_id, document.title, document.content);
  verifyHashOrThrow(actual, document.content_hash, 'Document', document.id);
}

/**
 * Verify ParkingLot entity hash
 *
 * Note: ParkingLot doesn't have content_hash in Section 0.5.3 spec,
 * but included for completeness and future-proofing.
 *
 * @param parkingLot - ParkingLot entity to verify
 * @param expectedHash - Expected hash value
 * @returns VerificationResult
 */
export function verifyParkingLotHash(
  parkingLot: ParkingLot,
  expectedHash: string
): VerificationResult {
  const actual = computeParkingLotHash(parkingLot.content, parkingLot.source_phase_id);
  return verifyHash(actual, expectedHash, 'ParkingLot', parkingLot.id);
}

/**
 * Verify ParkingLot entity hash with hard stop
 *
 * @param parkingLot - ParkingLot entity to verify
 * @param expectedHash - Expected hash value
 * @throws HashVerificationError if verification fails
 */
export function verifyParkingLotHashOrThrow(parkingLot: ParkingLot, expectedHash: string): void {
  const actual = computeParkingLotHash(parkingLot.content, parkingLot.source_phase_id);
  verifyHashOrThrow(actual, expectedHash, 'ParkingLot', parkingLot.id);
}

/**
 * Batch verification for multiple entities
 *
 * Returns array of verification results for all entities.
 * Does not throw on failure - use for reporting.
 *
 * @param entities - Array of entities with their verify functions
 * @returns Array of VerificationResults
 */
export function verifyBatch(
  entities: Array<{
    type: string;
    id: string;
    verify: () => VerificationResult;
  }>
): VerificationResult[] {
  return entities.map((entity) => entity.verify());
}

/**
 * Check if all verification results are valid
 *
 * @param results - Array of VerificationResults
 * @returns true if all results are valid, false otherwise
 */
export function allVerificationsValid(results: VerificationResult[]): boolean {
  return results.every((result) => result.valid);
}

/**
 * Get failed verifications from results
 *
 * @param results - Array of VerificationResults
 * @returns Array of failed VerificationResults
 */
export function getFailedVerifications(results: VerificationResult[]): VerificationResult[] {
  return results.filter((result) => !result.valid);
}
