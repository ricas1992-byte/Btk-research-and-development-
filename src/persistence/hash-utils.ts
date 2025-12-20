import crypto from 'crypto';

/**
 * Hash utilities for content verification.
 * Format: "v1:" + SHA-256 lowercase hex
 * Normalize: UTF-8, LF newlines
 */

const HASH_VERSION = 'v1:';

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

export function computeDecisionHash(title: string, statement: string, rationale: string): string {
  const normalized = [
    normalizeText(title),
    normalizeText(statement),
    normalizeText(rationale),
  ].join('\0');
  const hash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  return HASH_VERSION + hash;
}

export function computeSnapshotHash(title: string, content: string): string {
  const normalized = [normalizeText(title), normalizeText(content)].join('\0');
  const hash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  return HASH_VERSION + hash;
}

export function verifyDecisionHash(
  title: string,
  statement: string,
  rationale: string,
  expectedHash: string
): boolean {
  const actualHash = computeDecisionHash(title, statement, rationale);
  return actualHash === expectedHash;
}

export function verifySnapshotHash(title: string, content: string, expectedHash: string): boolean {
  const actualHash = computeSnapshotHash(title, content);
  return actualHash === expectedHash;
}
