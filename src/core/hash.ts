/**
 * SHA-256 Hash Utilities for CDW
 * Section 0.5.5: Hash Verification Protocol
 *
 * Algorithm: SHA-256
 * Scope: All entity content fields
 * Timing: Computed on create, verified on read, recomputed on update
 * Chain: Each entity hash includes reference to parent entity hash where applicable
 * Verification failure: Hard stop, no recovery, require operator intervention
 */

import crypto from 'crypto';
import type { HashResult } from './types.js';

/**
 * Hash version for future algorithm changes
 */
const HASH_VERSION = 'v1';
const HASH_ALGORITHM = 'sha256';

/**
 * Normalize text content for consistent hashing
 *
 * Ensures:
 * - UTF-8 encoding
 * - LF newlines (normalizes CRLF to LF)
 * - Consistent whitespace
 */
export function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

/**
 * Compute SHA-256 hash of content
 *
 * Returns hash in format: "v1:hexdigest"
 *
 * @param content - Content to hash (will be normalized)
 * @returns Hash string with version prefix
 */
export function computeHash(content: string): string {
  const normalized = normalizeText(content);
  const hash = crypto.createHash(HASH_ALGORITHM).update(normalized, 'utf8').digest('hex');

  return `${HASH_VERSION}:${hash}`;
}

/**
 * Compute SHA-256 hash from multiple content fields
 *
 * Fields are joined with null byte separator to prevent collision attacks.
 *
 * @param fields - Array of content fields to hash
 * @returns Hash string with version prefix
 */
export function computeHashFromFields(fields: string[]): string {
  const normalized = fields.map(normalizeText).join('\0');
  const hash = crypto.createHash(HASH_ALGORITHM).update(normalized, 'utf8').digest('hex');

  return `${HASH_VERSION}:${hash}`;
}

/**
 * Compute hash for Phase entity
 *
 * Per Section 0.5.3, Phase includes: id, name, description
 *
 * @param id - Phase ID
 * @param name - Phase name
 * @param description - Phase description
 * @returns Hash string
 */
export function computePhaseHash(id: string, name: string, description: string): string {
  return computeHashFromFields([id, name, description]);
}

/**
 * Compute hash for Decision entity
 *
 * Per Section 0.5.3, Decision includes: phase_id, content
 * Hash chain: Includes parent phase_id
 *
 * @param phaseId - Parent phase ID (for hash chain)
 * @param content - Decision content
 * @returns Hash string
 */
export function computeDecisionHash(phaseId: string, content: string): string {
  return computeHashFromFields([phaseId, content]);
}

/**
 * Compute hash for Task entity
 *
 * Per Section 0.5.3, Task includes: decision_id, title, description
 * Hash chain: Includes parent decision_id
 *
 * @param decisionId - Parent decision ID (for hash chain)
 * @param title - Task title
 * @param description - Task description
 * @returns Hash string
 */
export function computeTaskHash(decisionId: string, title: string, description: string): string {
  return computeHashFromFields([decisionId, title, description]);
}

/**
 * Compute hash for Document entity
 *
 * Per Section 0.5.3, Document includes: phase_id, title, content
 * Hash chain: Includes parent phase_id
 *
 * @param phaseId - Parent phase ID (for hash chain)
 * @param title - Document title
 * @param content - Document content (plain text)
 * @returns Hash string
 */
export function computeDocumentHash(phaseId: string, title: string, content: string): string {
  return computeHashFromFields([phaseId, title, content]);
}

/**
 * Compute hash for ParkingLot entity
 *
 * Per Section 0.5.3, ParkingLot includes: content, source_phase_id (optional)
 *
 * @param content - Idea content
 * @param sourcePhaseId - Optional source phase ID
 * @returns Hash string
 */
export function computeParkingLotHash(
  content: string,
  sourcePhaseId: string | null = null
): string {
  const fields = [content];
  if (sourcePhaseId) {
    fields.push(sourcePhaseId);
  }
  return computeHashFromFields(fields);
}

/**
 * Extract hash value from versioned hash string
 *
 * @param versionedHash - Hash string in format "v1:hexdigest"
 * @returns Hash hexdigest without version prefix
 */
export function extractHashValue(versionedHash: string): string {
  const parts = versionedHash.split(':');
  return parts.length === 2 ? parts[1] : versionedHash;
}

/**
 * Extract hash version from versioned hash string
 *
 * @param versionedHash - Hash string in format "v1:hexdigest"
 * @returns Version string (e.g., "v1")
 */
export function extractHashVersion(versionedHash: string): string {
  const parts = versionedHash.split(':');
  return parts.length === 2 ? parts[0] : 'unknown';
}

/**
 * Get detailed hash result with metadata
 *
 * @param content - Content to hash
 * @returns HashResult with algorithm and version metadata
 */
export function getHashResult(content: string): HashResult {
  const hash = computeHash(content);
  return {
    hash,
    algorithm: 'SHA-256',
    version: HASH_VERSION,
  };
}
