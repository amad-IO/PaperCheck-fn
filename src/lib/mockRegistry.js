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
export const INITIAL_REGISTRY = [
  {
    contentHash: '0x8f2c510a7b4e91d3e82a93c7d6e5f4a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5',
    simHash: calculateSimHash(SAMPLE_ABSTRACTS.SAMPLE_A),
    title: 'Utilization of Cocoa Pod Husk Waste as a Biosorbent for Heavy Metal Lead and Copper',
    category: 'Energy & Environment',
    author: 'Applied Chemistry Research Group',
    institution: 'National University of Science & Technology',
    registeredAt: 1714521600000,
    registrant: '0x71C8364437a90961f84582042a552746b34571Cd',
    participations: [
      {
        id: 1,
        competitionName: 'National Collegiate Scientific Olympiad 2024',
        year: 2024,
        category: 'Applied Chemistry & Ecology',
        status: 'Finalist', // Participant / Finalist / Winner
        recordedBy: '0x356A192B7913B04C54574D18C28D46E6395428AB',
        recorderName: 'Higher Education Research Council',
        domain: 'research.gov.edu',
        badge: 'domain_verified', // domain_verified | attested | anonymous | disputed
        recordedAt: 1729468800000,
        isDisputed: false,
      },
      {
        id: 2,
        competitionName: 'Green Technology National Paper Contest 2025',
        year: 2025,
        category: 'Green Material Innovation',
        status: 'Winner',
        recordedBy: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
        recorderName: 'Engineering Student Council',
        domain: 'ugm.ac.id',
        badge: 'domain_verified',
        recordedAt: 1740096000000,
        isDisputed: false,
      }
    ]
  },
  {
    contentHash: '0x4a91c82e0f3b7d6a5c4e1f8a9b0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    simHash: calculateSimHash('Autonomous drone deployment for peatland deforestation mapping powered by machine learning computer vision'),
    title: 'Autonomous Drone Deployment for Peatland Deforestation Mapping',
    category: 'Information Technology',
    author: 'Intelligent Systems Research Team',
    institution: 'Institute of Technology',
    registeredAt: 1719792000000,
    registrant: '0x8b3C210A8f29C71D82405628172957102948bB19',
    participations: [
      {
        id: 3,
        competitionName: 'National Youth Science Forum 2024',
        year: 2024,
        category: 'Artificial Intelligence',
        status: 'Participant',
        recordedBy: '0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C',
        recorderName: 'Independent Science Foundation',
        domain: 'scienceforum.org',
        badge: 'anonymous',
        recordedAt: 1724198400000,
        isDisputed: true,
        disputeNote: 'Manuscript was only an unsubmitted draft; our team never submitted a final version to this forum.'
      }
    ]
  }
];

/**
 * Registry Store Manager with localStorage persistence
 */
const STORAGE_KEY = 'papercheck_manuscript_registry_v1';

export function getRegistry() {
  if (typeof window === 'undefined') return INITIAL_REGISTRY;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTRY));
      return INITIAL_REGISTRY;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_REGISTRY;
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
export function registerManuscriptLocal({ title, category, author, institution, email, sha256, simHash, registrantWallet }) {
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
