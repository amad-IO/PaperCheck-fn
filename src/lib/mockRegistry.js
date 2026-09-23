import { calculateHammingDistance, calculateSimilarityPercentage, calculateSimHash } from './simhash';
import { calculateSha256 } from './hasher';

// Initial sample seed abstracts
export const SAMPLE_ABSTRACTS = {
  SAMPLE_A: `Pemanfaatan limbah kulit kakao sebagai biosorben logam berat timbal dan tembaga pada perairan sungai tercemar. Penelitian ini mengkaji efektivitas adsorpsi menggunakan aktivasi asam sitrat dengan metode spektrofotometri serapan atom. Hasil menunjukkan kapasitas adsorpsi optimum sebesar 89.4 persen pada waktu kontak 60 menit dan pH 5. Karakterisasi FTIR membuktikan adanya gugus karboksil dan hidroksil yang berperan aktif dalam pengikatan kation logam berat secara efisien dan ramah lingkungan.`,
  
  // Slightly paraphrased version of SAMPLE_A to test near-duplicate detection
  SAMPLE_A_PARAPHRASED: `Optimalisasi biosorben dari limbah kulit buah kakao untuk remediasi pencemaran ion logam berat timbal dan tembaga pada air limbah. Kajian ini menganalisis efisiensi penyerapan dengan modifikasi aktivator asam sitrat melalui spektrofotometri serapan atom. Data memperlihatkan tingkat adsorpsi terbaik mencapai 87.8 persen pada durasi kontak 60 menit dengan kondisi pH 5. Analisis spektroskopi FTIR mengonfirmasi kehadiran gugus fungsi karboksil dan hidroksil dalam mengadsorpsi ion logam secara berkelanjutan.`,

  SAMPLE_CLEAN: `Rancang bangun sistem monitoring kualitas udara berbasis Internet of Things menggunakan protokol komunikasi LoRaWAN pada kawasan industri manufaktur. Integrasi sensor partikulat PM2.5 dan gas karbon monoksida dianalisis secara real-time melalui mikrokontroler hemat daya. Pengujian transmisi data menunjukkan packet loss di bawah 1.2 persen pada jarak 3.5 kilometer dalam lingkungan urban padat.`
};

// Initial in-memory mock registry
export const INITIAL_REGISTRY = [
  {
    contentHash: '0x8f2c510a7b4e91d3e82a93c7d6e5f4a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5',
    simHash: calculateSimHash(SAMPLE_ABSTRACTS.SAMPLE_A),
    title: 'Pemanfaatan Limbah Kulit Kakao sebagai Biosorben Logam Berat Timbal dan Tembaga',
    category: 'Energi & Lingkungan',
    author: 'Tim Riset Kimia Terapan',
    institution: 'Universitas Negeri Makassar',
    registeredAt: 1714521600000, // Mei 2024
    registrant: '0x71C8364437a90961f84582042a552746b34571Cd',
    participations: [
      {
        id: 1,
        competitionName: 'Pekan Ilmiah Mahasiswa Nasional (PIMNAS 37)',
        year: 2024,
        category: 'PKM-RE',
        status: 'Finalis', // Peserta / Finalis / Juara
        recordedBy: '0x356A192B7913B04C54574D18C28D46E6395428AB',
        recorderName: 'Puspresnas / Balma Dikti',
        domain: 'puspresnas.kemdikbud.go.id',
        badge: 'domain_verified', // domain_verified | attested | anonymous | disputed
        recordedAt: 1729468800000,
        isDisputed: false,
      },
      {
        id: 2,
        competitionName: 'LKTI Nasional Green Technology UGM',
        year: 2025,
        category: 'Inovasi Material Hijau',
        status: 'Juara',
        recordedBy: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
        recorderName: 'BEM KM UGM',
        domain: 'ugm.ac.id',
        badge: 'domain_verified',
        recordedAt: 1740096000000,
        isDisputed: false,
      }
    ]
  },
  {
    contentHash: '0x4a91c82e0f3b7d6a5c4e1f8a9b0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    simHash: calculateSimHash('Penerapan teknologi drone otonom untuk pemetaan deforestasi hutan gambut berbasis machine learning computer vision'),
    title: 'Penerapan Drone Otonom untuk Pemetaan Deforestasi Hutan Gambut',
    category: 'Teknologi Informasi',
    author: 'Informatika Cendekia',
    institution: 'Institut Teknologi Bandung',
    registeredAt: 1719792000000,
    registrant: '0x8b3C210A8f29C71D82405628172957102948bB19',
    participations: [
      {
        id: 3,
        competitionName: 'National Youth Science Forum 2024',
        year: 2024,
        category: 'Artificial Intelligence',
        status: 'Peserta',
        recordedBy: '0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C',
        recorderName: 'Forum Sains Mandiri',
        domain: 'forumsains.org',
        badge: 'anonymous',
        recordedAt: 1724198400000,
        isDisputed: true,
        disputeNote: 'Naskah hanya didaftarkan draft, tim kami tidak pernah mengirimkan berkas final ke forum ini.'
      }
    ]
  }
];

/**
 * Registry Store Manager with localStorage persistence
 */
const STORAGE_KEY = 'lkti_manuscript_registry_v1';

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
    title: title || 'Naskah Tanpa Judul',
    category: category || 'Umum',
    author: author || 'Anonim',
    institution: institution || 'Umum',
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
    category: category || 'Umum',
    status, // Peserta / Finalis / Juara
    recordedBy,
    recorderName: recorderName || 'Panitia Pelaksana',
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
