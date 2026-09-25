import CONTRACT_ABI from './contractAbi.json';
import { encodeFunctionData } from 'viem';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x35A323b4543BE05666fB953dae959d303A06325E';

export { CONTRACT_ABI };

/**
 * Common chain configurations for block explorer and network naming
 */
export const KNOWN_CHAINS = {
  84532: {
    name: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org',
  },
  11155111: {
    name: 'Ethereum Sepolia',
    explorer: 'https://sepolia.etherscan.io',
  },
  4202: {
    name: 'Lisk Sepolia',
    explorer: 'https://sepolia-blockscout.lisk.com',
  },
  80002: {
    name: 'Polygon Amoy',
    explorer: 'https://amoy.polygonscan.com',
  },
  421614: {
    name: 'Arbitrum Sepolia',
    explorer: 'https://sepolia.arbiscan.io',
  },
};

export function getNetworkName(chainId) {
  if (!chainId) return 'Testnet';
  const known = KNOWN_CHAINS[Number(chainId)];
  if (known) return known.name;
  return `Chain #${chainId}`;
}

export function getExplorerTxUrl(txHash, chainId) {
  if (!txHash) return '#';
  const known = KNOWN_CHAINS[Number(chainId)];
  if (known && known.explorer) {
    return `${known.explorer}/tx/${txHash}`;
  }
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

export function getExplorerAddressUrl(address, chainId) {
  if (!address) return '#';
  const known = KNOWN_CHAINS[Number(chainId)];
  if (known && known.explorer) {
    return `${known.explorer}/address/${address}`;
  }
  return `https://sepolia.basescan.org/address/${address}`;
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
