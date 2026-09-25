import { calculateHammingDistance, calculateSimilarityPercentage, calculateSimHash } from './simhash';
import { calculateSha256 } from './hasher';

// Initial sample seed abstracts
export const SAMPLE_ABSTRACTS = {
  SAMPLE_A: `Utilization of cocoa pod husk waste as a biosorbent for heavy metal lead and copper in contaminated river waters. This study investigates adsorption efficacy using citric acid activation evaluated by atomic absorption spectrophotometry. Results demonstrate an optimum adsorption capacity of 89.4 percent at 60 minutes contact time and pH 5. FTIR characterization verifies the active role of carboxyl and hydroxyl functional groups in capturing heavy metal cations sustainably and efficiently.`,
  
  // Slightly paraphrased version of SAMPLE_A to test near-duplicate detection
  SAMPLE_A_PARAPHRASED: `Optimization of cocoa pod shell biosorbent for remediating heavy metal lead and copper pollution in wastewater streams. This study analyzes sorption efficiency through citric acid activation using atomic absorption spectrophotometry. Experimental data reveals a peak adsorption rate of 87.8 percent over 60 minutes of contact under pH 5 conditions. FTIR spectroscopic analysis corroborates the functional participation of carboxyl and hydroxyl groups in eco-friendly metal ion binding.`,

  SAMPLE_CLEAN: `Design and implementation of an Internet of Things air quality monitoring network using the LoRaWAN communication protocol across industrial manufacturing zones. Real-time integration of particulate matter PM2.5 and carbon monoxide sensors is processed via low-power microcontrollers. Transmission stress tests demonstrated packet loss below 1.2 percent across a 3.5-kilometer range in dense urban environments.`
};

// Initial in-memory mock registry
export const INITIAL_REGISTRY = [];

/**
 * Registry Store Manager with localStorage persistence
 */
const STORAGE_KEY = 'papercheck_manuscript_registry_v1';

// Legacy dummy hashes to automatically strip from localStorage
const DUMMY_HASHES = new Set([
  '0x8f2c510a7b4e91d3e82a93c7d6e5f4a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5'.toLowerCase(),
  '0x4a91c82e0f3b7d6a5c4e1f8a9b0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c'.toLowerCase()
]);

export function getRegistry() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(item => !DUMMY_HASHES.has((item.contentHash || '').toLowerCase()));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveRegistry(registry) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error('Failed to persist registry:', e);
  }
}

/**
 * Check manuscript against registry
 * Returns: { status: 'clean' | 'participated' | 'similar', matchDetails: ... }
 */
export async function checkManuscriptRegistry(text) {
  const sha256 = await calculateSha256(text);
  const simHash = calculateSimHash(text);
  const registry = getRegistry();

  // 1. Check for Exact Match (SHA-256)
  const exactMatch = registry.find(item => item.contentHash.toLowerCase() === sha256.toLowerCase());
  if (exactMatch) {
    return {
      status: 'participated',
      type: 'exact',
      manuscript: exactMatch,
      participations: exactMatch.participations || [],
      similarityPercentage: 100,
      sha256,
      simHash
    };
  }

  // 2. Check for Near-Duplicate / Similarity Match (SimHash Hamming Distance)
  let highestSimilarity = 0;
  let bestMatch = null;

  for (const item of registry) {
    const distance = calculateHammingDistance(simHash, item.simHash);
    const similarity = calculateSimilarityPercentage(distance);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item;
    }
  }

  // Threshold: >= 80% similarity indicates paraphrased or near-duplicate paper
  if (highestSimilarity >= 80 && bestMatch) {
    return {
      status: 'similar',
      type: 'similarity',
      similarityPercentage: highestSimilarity,
      manuscript: bestMatch,
      participations: bestMatch.participations || [],
      sha256,
      simHash
    };
  }

  // 3. Clean (No match found)
  return {
    status: 'clean',
    similarityPercentage: highestSimilarity,
    sha256,
    simHash
  };
}

/**
 * Register new manuscript
 */
export function registerManuscriptLocal({ title, category, author, institution, email, sha256, simHash, registrantWallet, txHash, blockNumber }) {
  const registry = getRegistry();

  const newRecord = {
    contentHash: sha256,
    simHash: simHash,
    title: title || 'Untitled Manuscript',
    category: category || 'General',
    author: author || 'Anonymous',
    institution: institution || 'General',
    registeredAt: Date.now(),
    registrant: registrantWallet || '0x0000000000000000000000000000000000000000',
    txHash: txHash || null,
    blockNumber: blockNumber || null,
    participations: []
  };

  registry.unshift(newRecord);
  saveRegistry(registry);
  return newRecord;
}

/**
 * Add participation record to existing manuscript
 */
export function addParticipationLocal({ contentHash, competitionName, year, category, status, recordedBy, recorderName, domain, badge = 'anonymous' }) {
  const registry = getRegistry();
  const index = registry.findIndex(item => item.contentHash.toLowerCase() === contentHash.toLowerCase());

  const newParticipation = {
    id: Date.now(),
    competitionName,
    year: Number(year) || new Date().getFullYear(),
    category: category || 'General',
    status, // Participant / Finalist / Winner
    recordedBy,
    recorderName: recorderName || 'Organizing Committee',
    domain: domain || 'unverified.local',
    badge,
    recordedAt: Date.now(),
    isDisputed: false
  };

  if (index >= 0) {
    registry[index].participations.push(newParticipation);
  } else {
    // If manuscript not yet in registry, add it with initial participation
    registry.push({
      contentHash,
      simHash: '0x0000000000000000',
      title: competitionName + ' Entry',
      category,
      registeredAt: Date.now(),
      registrant: '0x0000000000000000000000000000000000000000',
      participations: [newParticipation]
    });
  }

  saveRegistry(registry);
  return newParticipation;
}

/**
 * Dispute a claim
 */
export function disputeClaimLocal(contentHash, participationId, disputeNote) {
  const registry = getRegistry();
  const manuscript = registry.find(item => item.contentHash.toLowerCase() === contentHash.toLowerCase());

  if (!manuscript) return false;

  const participation = manuscript.participations.find(p => p.id === Number(participationId));
  if (!participation) return false;

  participation.isDisputed = true;
  participation.badge = 'disputed';
  if (disputeNote) participation.disputeNote = disputeNote;

  saveRegistry(registry);
  return true;
}

/**
 * Merge on-chain manuscripts into local registry
 */
export function mergeWithOnChainData(onChainList) {
  if (!Array.isArray(onChainList) || onChainList.length === 0) {
    return getRegistry();
  }

  const currentList = getRegistry();
  const map = new Map();

  // 1. Index current local list
  for (const item of currentList) {
    if (item && item.contentHash) {
      map.set(item.contentHash.toLowerCase(), item);
    }
  }

  // 2. Merge or insert on-chain data
  for (const onChainItem of onChainList) {
    if (!onChainItem || !onChainItem.contentHash) continue;
    const key = onChainItem.contentHash.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      map.set(key, {
        ...existing,
        title: onChainItem.title || existing.title,
        category: onChainItem.category || existing.category,
        author: onChainItem.author || existing.author,
        institution: onChainItem.institution || existing.institution,
        registrant: onChainItem.registrant || existing.registrant,
        simHash: onChainItem.simHash || existing.simHash,
        registeredAt: onChainItem.registeredAt || existing.registeredAt,
        participations: (onChainItem.participations && onChainItem.participations.length > 0)
          ? onChainItem.participations
          : (existing.participations || []),
        isOnChain: true
      });
    } else {
      map.set(key, {
        ...onChainItem,
        isOnChain: true
      });
    }
  }

  const merged = Array.from(map.values());
  saveRegistry(merged);
  return merged;
}

