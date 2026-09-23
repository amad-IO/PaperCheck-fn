/**
 * 64-bit SimHash Implementation for Document Text Similarity
 * Runs 100% client-side in the browser.
 */

// Indonesian & English common stopwords for cleaner tokenization
const STOPWORDS = new Set([
  // Indonesian
  'yang', 'di', 'dan', 'ini', 'dari', 'dalam', 'untuk', 'dengan', 'adalah',
  'pada', 'ke', 'itu', 'sebagai', 'oleh', 'akan', 'atau', 'dapat', 'juga',
  'tidak', 'karena', 'tersebut', 'ada', 'lebih', 'sudah', 'antara', 'serta',
  'hanya', 'saat', 'seperti', 'bisa', 'secara', 'namun', 'bagi', 'harus',
  // English
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for',
  'of', 'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'be', 'are'
]);

/**
 * Clean and tokenize text into significant word tokens
 */
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\d]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOPWORDS.has(word));
}

/**
 * 64-bit FNV-1a Hash for individual word tokens
 * Returns a BigInt 64-bit unsigned integer
 */
export function fnv1a64(str) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash;
}

/**
 * Calculate 64-bit SimHash of a text document
 * Returns hex string representing the 64-bit fingerprint (e.g. "0x8f1a...")
 */
export function calculateSimHash(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return '0x0000000000000000';

  // Count word frequencies for weighting
  const freqMap = new Map();
  for (const token of tokens) {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }

  // 64-dimensional vector
  const v = new Array(64).fill(0);

  for (const [token, weight] of freqMap.entries()) {
    const tokenHash = fnv1a64(token);
    for (let i = 0; i < 64; i++) {
      const bit = (tokenHash >> BigInt(i)) & 1n;
      if (bit === 1n) {
        v[i] += weight;
      } else {
        v[i] -= weight;
      }
    }
  }

  // Generate 64-bit fingerprint
  let fingerprint = 0n;
  for (let i = 0; i < 64; i++) {
    if (v[i] > 0) {
      fingerprint |= (1n << BigInt(i));
    }
  }

  return '0x' + fingerprint.toString(16).padStart(16, '0');
}

/**
 * Calculate Hamming Distance between two 64-bit SimHash values
 * Distance: 0 (100% match) to 64 (0% match)
 */
export function calculateHammingDistance(hash1, hash2) {
  const h1 = BigInt(hash1);
  const h2 = BigInt(hash2);
  let xor = h1 ^ h2;
  let distance = 0;

  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

/**
 * Convert Hamming Distance (0-64) into a similarity percentage (0-100%)
 */
export function calculateSimilarityPercentage(distance) {
  const percentage = ((64 - distance) / 64) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage * 10) / 10));
}
