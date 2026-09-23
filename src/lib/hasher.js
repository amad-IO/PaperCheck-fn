import { calculateSimHash } from './simhash';

/**
 * Calculate SHA-256 hash using the native browser Web Crypto API
 * Returns standard 32-byte hex with 0x prefix (e.g. 0xabcd...64-chars)
 */
export async function calculateSha256(text) {
  if (!text) return '0x0000000000000000000000000000000000000000000000000000000000000000';
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

/**
 * Generate complete dual-fingerprint (SHA-256 for exact match + SimHash for similarity)
 */
export async function generateDocumentFingerprint(text) {
  const sha256 = await calculateSha256(text);
  const simHash = calculateSimHash(text);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return {
    sha256,
    simHash,
    wordCount,
    charCount,
    timestamp: Date.now()
  };
}
