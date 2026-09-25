import CONTRACT_ABI from './contractAbi.json';
import { encodeFunctionData, createPublicClient, http, custom, defineChain } from 'viem';
import { baseSepolia, sepolia, liskSepolia, arbitrumSepolia, polygonAmoy } from 'viem/chains';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x35A323b4543BE05666fB953dae959d303A06325E';

export { CONTRACT_ABI };

/**
 * Custom Bohr Network configurations
 */
export const bohrTestnet = defineChain({
  id: 968,
  name: 'Bohr Testnet',
  nativeCurrency: { name: 'Bohr', symbol: 'BOHR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
  blockExplorers: {
    default: { name: 'BohrScan', url: 'https://scan.bohr.life' },
  },
});

export const bohrMainnet = defineChain({
  id: 677,
  name: 'Bohr Mainnet',
  nativeCurrency: { name: 'Bohr', symbol: 'BOHR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.botchain.ai'] },
  },
  blockExplorers: {
    default: { name: 'BohrScan', url: 'https://scan.botchain.ai' },
  },
});

/**
 * Common chain configurations for block explorer and network naming
 */
export const KNOWN_CHAINS = {
  968: {
    name: 'Bohr Testnet',
    explorer: 'https://scan.bohr.life',
    rpc: 'https://rpc.bohr.life',
  },
  677: {
    name: 'Bohr Mainnet',
    explorer: 'https://scan.botchain.ai',
    rpc: 'https://rpc.botchain.ai',
  },
  84532: {
    name: 'Base Sepolia',
    explorer: 'https://scan.bohr.life',
    rpc: 'https://sepolia.base.org',
  },
  11155111: {
    name: 'Ethereum Sepolia',
    explorer: 'https://scan.bohr.life',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  4202: {
    name: 'Lisk Sepolia',
    explorer: 'https://scan.bohr.life',
    rpc: 'https://rpc.sepolia-api.lisk.com',
  },
  80002: {
    name: 'Polygon Amoy',
    explorer: 'https://amoy.polygonscan.com',
    rpc: 'https://rpc-amoy.polygon.technology',
  },
  421614: {
    name: 'Arbitrum Sepolia',
    explorer: 'https://scan.bohr.life',
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
};

export function getNetworkName(chainId) {
  if (!chainId) return 'Bohr Testnet';
  const known = KNOWN_CHAINS[Number(chainId)];
  if (known) return known.name;
  return `Chain #${chainId}`;
}

export function getExplorerTxUrl(txHash, chainId) {
  if (!txHash) return '#';
  const known = KNOWN_CHAINS[Number(chainId)];
  const rawBase = (known && known.explorer) ? known.explorer : 'https://scan.bohr.life';
  const base = rawBase.replace(/\/+$/, '');
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address, chainId) {
  if (!address) return '#';
  const known = KNOWN_CHAINS[Number(chainId)];
  const rawBase = (known && known.explorer) ? known.explorer : 'https://scan.bohr.life';
  const base = rawBase.replace(/\/+$/, '');
  return `${base}/address/${address}`;
}

/**
 * Poll for transaction receipt until confirmed or timeout
 */
export async function waitForTransactionReceipt(txHash, maxAttempts = 30, intervalMs = 2000) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Web3 provider window.ethereum not available');
  }

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });

      if (receipt && receipt.blockNumber) {
        if (receipt.status === '0x0') {
          throw new Error('Transaction was reverted on-chain by the smart contract.');
        }
        return receipt;
      }
    } catch (err) {
      if (err.message && err.message.includes('reverted')) {
        throw err;
      }
      console.warn('Checking receipt status:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { transactionHash: txHash, blockNumber: 'Pending' };
}

/**
 * Format bytes32 contentHash to ensure 0x prefix and exact 32 bytes (64 hex chars)
 */
export function formatBytes32(hash) {
  let clean = (hash || '').trim();
  if (!clean.startsWith('0x')) {
    clean = '0x' + clean;
  }
  if (clean.length < 66) {
    clean = clean.padEnd(66, '0');
  } else if (clean.length > 66) {
    clean = clean.slice(0, 66);
  }
  return clean;
}

/**
 * Format 64-bit simHash to BigInt for uint64 Solidity type
 */
export function formatSimHashBigInt(simHash) {
  if (typeof simHash === 'bigint') return simHash;
  if (typeof simHash === 'number') return BigInt(simHash);
  if (typeof simHash === 'string') {
    let clean = simHash.trim();
    if (!clean.startsWith('0x')) clean = '0x' + clean;
    return BigInt(clean);
  }
  return 0n;
}

/**
 * Register manuscript on-chain by invoking registerManuscript(...)
 */
export async function registerManuscriptOnChain({
  title,
  category = 'General',
  author,
  institution,
  sha256,
  simHash,
  userAddress,
  onTxSent
}) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or EVM Web3 wallet is not installed in your browser.');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const sender = userAddress || accounts[0];
  if (!sender) {
    throw new Error('No active wallet account selected. Please connect MetaMask.');
  }

  const formattedContentHash = formatBytes32(sha256);
  const formattedSimHash = formatSimHashBigInt(simHash);

  // Encode function call
  const callData = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: 'registerManuscript',
    args: [
      formattedContentHash,
      formattedSimHash,
      title || 'Untitled Manuscript',
      category || 'General',
      author || 'Anonymous',
      institution || 'General'
    ]
  });

  // Prompt transaction signing in MetaMask
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: sender,
        to: CONTRACT_ADDRESS,
        data: callData
      }
    ]
  });

  if (onTxSent && typeof onTxSent === 'function') {
    onTxSent(txHash);
  }

  // Await on-chain confirmation
  const receipt = await waitForTransactionReceipt(txHash);

  return {
    txHash,
    blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : 'Confirmed',
    receipt
  };
}

/**
 * Add competition participation on-chain (for committee)
 */
export async function addParticipationOnChain({
  contentHash,
  competitionName,
  year,
  category = 'General',
  status,
  recorderName,
  domain,
  userAddress
}) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or EVM Web3 wallet is not installed.');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const sender = userAddress || accounts[0];

  const formattedHash = formatBytes32(contentHash);

  const callData = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: 'addParticipation',
    args: [
      formattedHash,
      competitionName,
      Number(year) || new Date().getFullYear(),
      category || 'General',
      status,
      recorderName || 'Official Committee',
      domain || 'committee.org'
    ]
  });

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: sender,
        to: CONTRACT_ADDRESS,
        data: callData
      }
    ]
  });

  const receipt = await waitForTransactionReceipt(txHash);
  return { txHash, receipt };
}

/**
 * Batch add participation on-chain
 */
export async function batchAddParticipationOnChain({
  items,
  competitionName,
  year,
  category = 'General',
  recorderName,
  domain,
  userAddress
}) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or EVM Web3 wallet is not installed.');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const sender = userAddress || accounts[0];

  const contentHashes = items.map(it => formatBytes32(it.sha256));
  const competitionNames = items.map(() => competitionName);
  const years = items.map(() => Number(year) || new Date().getFullYear());
  const categories = items.map(() => category || 'General');
  const statuses = items.map(it => it.status);

  const callData = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: 'batchAddParticipation',
    args: [
      contentHashes,
      competitionNames,
      years,
      categories,
      statuses,
      recorderName || 'Official Committee',
      domain || 'committee.org'
    ]
  });

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: sender,
        to: CONTRACT_ADDRESS,
        data: callData
      }
    ]
  });

  const receipt = await waitForTransactionReceipt(txHash);
  return { txHash, receipt };
}

/**
 * Dispute participation on-chain
 */
export async function disputeParticipationOnChain({
  contentHash,
  participationIndex,
  disputeNote,
  userAddress
}) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or EVM Web3 wallet is not installed.');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const sender = userAddress || accounts[0];

  const callData = encodeFunctionData({
    abi: CONTRACT_ABI,
    functionName: 'disputeParticipation',
    args: [
      formatBytes32(contentHash),
      BigInt(participationIndex),
      disputeNote || 'Disputed by author'
    ]
  });

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: sender,
        to: CONTRACT_ADDRESS,
        data: callData
      }
    ]
  });

  const receipt = await waitForTransactionReceipt(txHash);
  return { txHash, receipt };
}

/**
 * Mapping of Chain IDs to Viem Chain configurations
 */
export const VIEM_CHAIN_MAP = {
  968: bohrTestnet,
  677: bohrMainnet,
  84532: baseSepolia,
  11155111: sepolia,
  4202: liskSepolia,
  80002: polygonAmoy,
  421614: arbitrumSepolia,
};

/**
 * Get Viem Public Client for reading from smart contract
 */
export function getPublicClient(chainId = 968) {
  const chainObj = VIEM_CHAIN_MAP[Number(chainId)] || bohrTestnet;
  return createPublicClient({
    chain: chainObj,
    transport: http()
  });
}

/**
 * Fetch all registered manuscripts directly from the blockchain
 */
export async function fetchManuscriptsFromChain({
  contractAddress = CONTRACT_ADDRESS,
  chainId = 968
} = {}) {
  const address = contractAddress || CONTRACT_ADDRESS;
  if (!address || address.length < 42 || address === '0x0000000000000000000000000000000000000000') {
    return [];
  }

  const client = getPublicClient(chainId);

  try {
    // 1. Fetch all hashes registered in smart contract
    const hashes = await client.readContract({
      address,
      abi: CONTRACT_ABI,
      functionName: 'getAllHashes'
    });

    if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
      return [];
    }

    // Fetch on-chain registration logs to extract real transaction hashes
    const txHashMap = new Map();
    try {
      const logs = await client.getLogs({
        address,
        fromBlock: 0n,
        toBlock: 'latest'
      });
      if (Array.isArray(logs)) {
        for (const log of logs) {
          if (log.topics && log.topics[1] && log.transactionHash) {
            txHashMap.set(log.topics[1].toLowerCase(), log.transactionHash);
          }
        }
      }
    } catch (logErr) {
      console.warn('Could not fetch logs for txHash mapping:', logErr);
    }

    // 2. Fetch details for each hash
    const manuscripts = [];
    for (const rawHash of hashes) {
      try {
        const m = await client.readContract({
          address,
          abi: CONTRACT_ABI,
          functionName: 'getManuscript',
          args: [rawHash]
        });

        if (!m || !m.exists) continue;

        // Fetch participations if any
        let participations = [];
        try {
          const rawParticipations = await client.readContract({
            address,
            abi: CONTRACT_ABI,
            functionName: 'getParticipations',
            args: [rawHash]
          });

          if (Array.isArray(rawParticipations)) {
            participations = rawParticipations.map((p, idx) => ({
              id: p.id ? Number(p.id) : (idx + 1),
              competitionName: p.competitionName || 'Unknown Competition',
              year: Number(p.year) || new Date().getFullYear(),
              category: p.category || 'General',
              status: p.status || 'Participant',
              recordedBy: p.recordedBy || '0x0000000000000000000000000000000000000000',
              recorderName: p.recorderName || 'Organizing Committee',
              domain: p.domain || 'unverified.local',
              recordedAt: p.recordedAt ? Number(p.recordedAt) * 1000 : Date.now(),
              isDisputed: Boolean(p.isDisputed),
              disputeNote: p.disputeNote || '',
              badge: p.isDisputed ? 'disputed' : (p.status === 'Juara' || p.status === 'Winner' ? 'verified' : 'participant')
            }));
          }
        } catch (pErr) {
          console.warn('Could not read participations for hash:', rawHash, pErr);
        }

        // Format simHash
        let formattedSimHash = '0x0000000000000000';
        try {
          if (typeof m.simHash === 'bigint') {
            formattedSimHash = '0x' + m.simHash.toString(16).padStart(16, '0');
          } else if (m.simHash) {
            formattedSimHash = '0x' + BigInt(m.simHash).toString(16).padStart(16, '0');
          }
        } catch (simErr) {
          console.warn('Formatting simHash:', simErr);
        }

        manuscripts.push({
          contentHash: m.contentHash,
          simHash: formattedSimHash,
          title: m.title || 'Untitled Manuscript',
          category: m.category || 'General',
          author: m.author || 'Anonymous',
          institution: m.institution || 'General',
          registeredAt: m.registeredAt ? Number(m.registeredAt) * 1000 : Date.now(),
          registrant: m.registrant || '0x0000000000000000000000000000000000000000',
          txHash: txHashMap.get((m.contentHash || '').toLowerCase()) || null,
          participations,
          isOnChain: true
        });
      } catch (itemErr) {
        console.warn('Failed to read manuscript for hash:', rawHash, itemErr);
      }
    }

    return manuscripts;
  } catch (err) {
    console.error('Error fetching manuscripts from blockchain:', err);
    throw err;
  }
}

/**
 * Fetch a single manuscript by hash directly from the blockchain
 */
export async function fetchSingleManuscriptFromChain({
  contentHash,
  contractAddress = CONTRACT_ADDRESS,
  chainId = 968
}) {
  const address = contractAddress || CONTRACT_ADDRESS;
  if (!address || !contentHash) return null;

  const client = getPublicClient(chainId);
  const formattedHash = formatBytes32(contentHash);

  try {
    const m = await client.readContract({
      address,
      abi: CONTRACT_ABI,
      functionName: 'getManuscript',
      args: [formattedHash]
    });

    if (!m || !m.exists) return null;

    let participations = [];
    try {
      const rawParticipations = await client.readContract({
        address,
        abi: CONTRACT_ABI,
        functionName: 'getParticipations',
        args: [formattedHash]
      });
      if (Array.isArray(rawParticipations)) {
        participations = rawParticipations.map((p, idx) => ({
          id: p.id ? Number(p.id) : (idx + 1),
          competitionName: p.competitionName,
          year: Number(p.year),
          category: p.category,
          status: p.status,
          recordedBy: p.recordedBy,
          recorderName: p.recorderName,
          domain: p.domain,
          recordedAt: Number(p.recordedAt) * 1000,
          isDisputed: Boolean(p.isDisputed),
          disputeNote: p.disputeNote || '',
          badge: p.isDisputed ? 'disputed' : 'participant'
        }));
      }
    } catch (e) {
      console.warn('Participations query failed:', e);
    }

    let formattedSimHash = '0x0000000000000000';
    try {
      if (typeof m.simHash === 'bigint') {
        formattedSimHash = '0x' + m.simHash.toString(16).padStart(16, '0');
      } else if (m.simHash) {
        formattedSimHash = '0x' + BigInt(m.simHash).toString(16).padStart(16, '0');
      }
    } catch (e) {}

    return {
      contentHash: m.contentHash,
      simHash: formattedSimHash,
      title: m.title,
      category: m.category,
      author: m.author,
      institution: m.institution,
      registeredAt: Number(m.registeredAt) * 1000,
      registrant: m.registrant,
      participations,
      isOnChain: true
    };
  } catch (err) {
    console.error('Error fetching single manuscript from chain:', err);
    return null;
  }
}

