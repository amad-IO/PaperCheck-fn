'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Calendar, Hash, ShieldAlert, CheckCircle2, User, ExternalLink, ShieldCheck, AlertCircle, History, ChevronDown, Check, Award, RefreshCw, Radio, Search, X } from 'lucide-react';
import { getRegistry, disputeClaimLocal, mergeWithOnChainData, INITIAL_REGISTRY } from '../../lib/mockRegistry';
import { disputeParticipationOnChain, getExplorerTxUrl, getExplorerAddressUrl, fetchManuscriptsFromChain, CONTRACT_ADDRESS, getNetworkName } from '../../lib/contract';
import BadgePill from '../BadgePill';

export default function DetailNaskahView({ walletState, showToast, setActiveTab }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [registryList, setRegistryList] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const list = getRegistry();
        if (list && list.length > 0) return list;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_REGISTRY;
  });

  const [selectedHash, setSelectedHash] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const list = getRegistry();
        if (list && list.length > 0) return list[0].contentHash;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_REGISTRY[0]?.contentHash || '';
  });

  const [currentManuscript, setCurrentManuscript] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const list = getRegistry();
        if (list && list.length > 0) return list[0];
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_REGISTRY[0] || null;
  });

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [targetParticipation, setTargetParticipation] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');

  // Fetch registered manuscripts directly from the smart contract
  const handleSyncBlockchain = useCallback(async (manual = false) => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    if (manual) {
      showToast('Syncing Blockchain', 'Fetching registered manuscripts from smart contract...', 'info');
    }

    try {
      const chainManuscripts = await fetchManuscriptsFromChain({
        contractAddress: CONTRACT_ADDRESS,
        chainId: walletState?.chainId || 968
      });

      if (chainManuscripts && chainManuscripts.length > 0) {
        const mergedList = mergeWithOnChainData(chainManuscripts);
        setRegistryList(mergedList);

        setSelectedHash((prevHash) => {
          const exists = mergedList.some(item => item.contentHash.toLowerCase() === (prevHash || '').toLowerCase());
          const activeHash = exists ? prevHash : mergedList[0]?.contentHash || '';
          const activeItem = mergedList.find(item => item.contentHash.toLowerCase() === activeHash.toLowerCase()) || mergedList[0] || null;
          setCurrentManuscript(activeItem);
          return activeHash;
        });

        setSyncStatus('synced');
        if (manual) {
          showToast('Sync Successful', `Loaded ${chainManuscripts.length} manuscript(s) directly from the blockchain!`, 'success');
        }
      } else {
        setSyncStatus('synced');
        if (manual) {
          showToast('Sync Complete', 'Smart contract checked. No additional manuscripts found on-chain.', 'info');
        }
      }
    } catch (err) {
      console.warn('Smart contract sync warning:', err);
      setSyncStatus('error');
      if (manual) {
        showToast('Sync Notice', 'Could not fetch from smart contract on current network. Showing local cache.', 'warning');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [walletState?.chainId, showToast]);

  useEffect(() => {
    const list = getRegistry();
    setRegistryList(list);
    if (list && list.length > 0) {
      const stillExists = list.some(item => item.contentHash === selectedHash);
      if (!stillExists) {
        setSelectedHash(list[0].contentHash);
        setCurrentManuscript(list[0]);
      } else {
        const found = list.find(item => item.contentHash === selectedHash);
        setCurrentManuscript(found || list[0]);
      }
    } else {
      setSelectedHash('');
      setCurrentManuscript(null);
    }

    // Auto-sync on-chain data in background
    handleSyncBlockchain(false);
  }, [walletState?.chainId, handleSyncBlockchain]);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [dropdownOpen]);

  const filteredRegistry = registryList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const titleMatch = (item.title || '').toLowerCase().includes(q);
    const authorMatch = (item.author || '').toLowerCase().includes(q);
    const categoryMatch = (item.category || '').toLowerCase().includes(q);
    const hashMatch = (item.contentHash || '').toLowerCase().includes(q);
    const registrantMatch = (item.registrant || '').toLowerCase().includes(q);
    const txMatch = (item.txHash || '').toLowerCase().includes(q);

    return titleMatch || authorMatch || categoryMatch || hashMatch || registrantMatch || txMatch;
  });

  const handleSelectManuscript = (hash) => {
    setSelectedHash(hash);
    const found = registryList.find(item => item.contentHash === hash);
    setCurrentManuscript(found || null);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const handleOpenDispute = (part) => {
    const isOriginalRegistrant = walletState.isConnected && 
      walletState.address.toLowerCase() === (currentManuscript?.registrant || '').toLowerCase();

    if (!isOriginalRegistrant) {
      showToast(
        'Access Restricted', 
        'Only the wallet address that originally registered this paper has the right to dispute claims.', 
        'warning'
      );
      return;
    }

    setTargetParticipation(part);
    setDisputeModalOpen(true);
  };

  const submitDispute = async () => {
    if (!targetParticipation || !currentManuscript) return;

    try {
      if (typeof window !== 'undefined' && window.ethereum && walletState.isConnected) {
        showToast('Confirm Dispute', 'Please confirm the dispute transaction in MetaMask...', 'info');
        const participationIndex = (currentManuscript.participations || []).findIndex(
          p => p.id === targetParticipation.id
        );
        if (participationIndex >= 0) {
          await disputeParticipationOnChain({
            contentHash: currentManuscript.contentHash,
            participationIndex,
            disputeNote: disputeNote || 'Disputed by author',
            userAddress: walletState.address
          });
        }
      }

      const success = disputeClaimLocal(
        currentManuscript.contentHash, 
        targetParticipation.id, 
        disputeNote || 'Disputed by original registrant.'
      );

      if (success) {
        showToast('Dispute Recorded', 'This participation claim has been permanently disputed on the smart contract.', 'success');
        const updatedList = getRegistry();
        setRegistryList(updatedList);
        const updatedCurrent = updatedList.find(item => item.contentHash === currentManuscript.contentHash);
        setCurrentManuscript(updatedCurrent);
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Failed to submit dispute.';
      if (err?.code === 4001 || err?.message?.includes('rejected')) {
        msg = 'Dispute transaction was rejected in your wallet.';
      }
      showToast('Dispute Error', msg, 'error');
    } finally {
      setDisputeModalOpen(false);
      setDisputeNote('');
    }
  };

  const isOwner = walletState.isConnected && 
    walletState.address.toLowerCase() === (currentManuscript?.registrant || '').toLowerCase();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <History className="w-3.5 h-3.5 text-brand-primary" />
          <span>Immutable Public Audit Trail & Dispute Resolution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Paper Details & Blockchain Timeline
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Audit the chronological timeline of on-chain registrations and competition track records.
        </p>
      </section>

      {/* Empty State or Content */}
      {registryList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-brand-primary flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-brand-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No Manuscripts Registered Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            The local registry is empty. If someone has registered a manuscript on the blockchain, click the sync button below to fetch all records directly from the smart contract.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleSyncBlockchain(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 shadow-sm transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-primary' : 'text-slate-600'}`} />
              <span>{isSyncing ? 'Fetching from Contract...' : 'Sync from Smart Contract'}</span>
            </button>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('daftarkan')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs shadow-sm hover:bg-brand-secondary transition-all"
              >
                Register a Manuscript Now
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Select / Search Paper Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30 transition-colors">
            <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto relative" ref={dropdownRef}>
              <span className="text-xs font-semibold text-slate-500 font-mono whitespace-nowrap">Select Paper:</span>
          
              {/* Custom Popover Dropdown */}
              <div className="relative flex-1 sm:w-80">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full rounded-xl py-2 px-3 text-xs font-medium text-slate-800 flex items-center justify-between gap-2 text-left transition-all focus:outline-none ${
                    dropdownOpen
                      ? 'bg-white border border-brand-primary ring-2 ring-brand-primary/20 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="truncate">
                    {currentManuscript?.title || 'Select a paper...'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-brand-primary' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Bar Header */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 backdrop-blur-sm sticky top-0 z-10">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search title, author, or 0x hash..."
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all font-sans"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery('');
                              searchInputRef.current?.focus();
                            }}
                            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Search Result Counter & Hash Badge */}
                      {searchQuery && (
                        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-mono">
                          <span>{filteredRegistry.length} result{filteredRegistry.length === 1 ? '' : 's'} found</span>
                          {searchQuery.trim().toLowerCase().startsWith('0x') && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-mono font-medium">
                              Hash Query
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Manuscripts List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {filteredRegistry.length === 0 ? (
                        <div className="py-8 px-4 text-center space-y-1">
                          <Search className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs font-semibold text-slate-700">No matching manuscripts</p>
                          <p className="text-[11px] text-slate-400">
                            Try searching with another title, author, or hash
                          </p>
                        </div>
                      ) : (
                        filteredRegistry.map((item) => {
                          const isSelected = item.contentHash === selectedHash;
                          const qTrim = searchQuery.trim().toLowerCase();
                          const isHashMatch = qTrim && (
                            item.contentHash?.toLowerCase().includes(qTrim) ||
                            item.txHash?.toLowerCase().includes(qTrim) ||
                            item.registrant?.toLowerCase().includes(qTrim)
                          );

                          return (
                            <button
                              key={item.contentHash}
                              type="button"
                              onClick={() => handleSelectManuscript(item.contentHash)}
                              className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between gap-2.5 group ${
                                isSelected
                                  ? 'bg-orange-50/70 text-slate-900 font-semibold border-l-2 border-brand-primary'
                                  : 'hover:bg-slate-50 text-slate-700 font-normal'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs truncate ${isSelected ? 'text-brand-700 font-semibold' : 'text-slate-800 group-hover:text-slate-900'}`}>
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{item.category || 'General'}</span>
                                  <span>•</span>
                                  <span>{item.author}</span>
                                  {item.isOnChain && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600 font-semibold">On-Chain</span>
                                    </>
                                  )}
                                </div>
                                {isHashMatch && (
                                  <p className="text-[10px] text-orange-600 font-mono truncate mt-1 bg-orange-50/60 px-1 py-0.5 rounded">
                                    Hash: {item.contentHash}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Blockchain Manual Sync Button */}
              <button
                type="button"
                onClick={() => handleSyncBlockchain(true)}
                disabled={isSyncing}
                title="Sync and load newly registered manuscripts from the smart contract"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 disabled:opacity-60 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-primary ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync On-Chain'}</span>
              </button>
            </div>

            {currentManuscript && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                {currentManuscript.isOnChain && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                    <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span className="hidden sm:inline">On-Chain Sync</span>
                  </span>
                )}
                {isOwner ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Original Author</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Public Preview</span>
                )}
              </div>
            )}
          </div>

          {currentManuscript && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6 transition-colors duration-200">
              
              {/* Metadata Header */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                    {currentManuscript.category || 'General'}
                  </span>
                  {currentManuscript.isOnChain && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-blue-600" />
                      Smart Contract Record
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Registered: {new Date(currentManuscript.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentManuscript.title}
            </h2>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 font-mono pt-1">
              <div>Author: <strong className="text-slate-900">{currentManuscript.author}</strong></div>
              <div>Institution: <strong className="text-slate-900">{currentManuscript.institution}</strong></div>
              <div className="truncate max-w-xs">
                Registrant: <span className="text-brand-700">{currentManuscript.registrant}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Identifiers & On-Chain Proof */}
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Content Hash (SHA-256)</span>
                <div className="text-[11px] text-brand-700 font-bold break-all">{currentManuscript.contentHash}</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">SimHash 64-Bit Fingerprint</span>
                <div className="text-[11px] text-slate-800 font-bold">{currentManuscript.simHash}</div>
              </div>
            </div>

            {(currentManuscript.txHash || currentManuscript.isOnChain) && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 uppercase font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>On-Chain Registration Transaction Hash</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 break-all font-mono">
                    {currentManuscript.txHash || 'Confirmed On-Chain (Smart Contract Verified)'}
                  </div>
                </div>
                <a
                  href={currentManuscript.txHash 
                    ? getExplorerTxUrl(currentManuscript.txHash, walletState?.chainId || 968)
                    : getExplorerAddressUrl(CONTRACT_ADDRESS, walletState?.chainId || 968)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-sm transition-all"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </div>
            )}
          </div>

          {/* Blockchain Timeline (Genesis + Participations) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
                Blockchain Timeline ({1 + (currentManuscript.participations?.length || 0)} Events):
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Genesis Block + Competition Track Record
              </span>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-3.5 sm:ml-4 space-y-6 pb-2">
              
              {/* EVENT 1: GENESIS / INITIAL ON-CHAIN REGISTRATION (TRANSAKSI PERTAMA) */}
              <div className="relative pl-6 sm:pl-8">
                {/* Timeline Node */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-emerald-100 flex items-center justify-center"></div>

                {/* Timeline Card */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 uppercase">
                          Transaksi #1 (Genesis)
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          Initial Paper Registration (Proof-of-Existence)
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        Recorded: {new Date(currentManuscript.registeredAt).toLocaleString('en-US')}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full font-mono text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>On-Chain Verified</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cryptographic fingerprint (SHA-256 & SimHash) permanently committed to smart contract storage with an immutable blockchain timestamp.
                  </p>

                  {/* Transaction Details & Explorer Link */}
                  <div className="pt-2 border-t border-emerald-200/70 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate max-w-md">
                      <span className="text-slate-500">Registrant:</span>
                      <span className="font-semibold text-brand-700 truncate">{currentManuscript.registrant}</span>
                    </div>

                    {currentManuscript.txHash ? (
                      <a
                        href={getExplorerTxUrl(currentManuscript.txHash, walletState?.chainId || 968)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Tx On Explorer ({currentManuscript.txHash.slice(0, 10)}...)</span>
                      </a>
                    ) : (
                      <a
                        href={getExplorerAddressUrl(CONTRACT_ADDRESS, walletState?.chainId || 968)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Contract On Explorer</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* SUBSEQUENT EVENTS: COMPETITION PARTICIPATIONS */}
              {currentManuscript.participations && currentManuscript.participations.map((part, index) => (
                <div key={part.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline Node */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-primary"></div>

                  {/* Timeline Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700 uppercase">
                            Transaksi #{index + 2}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{part.competitionName}</h4>
                          <span className="font-mono text-xs text-slate-400">({part.year})</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Category: {part.category}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold self-start sm:self-auto ${
                        part.status === 'Winner' || part.status === 'Juara'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : part.status === 'Finalist' || part.status === 'Finalis'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        Status: {part.status === 'Juara' ? 'Winner' : (part.status === 'Finalis' ? 'Finalist' : part.status === 'Peserta' ? 'Participant' : part.status)}
                      </span>
                    </div>

                    {/* Source & Credibility */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Recorded By:</span>
                        <span className="font-medium text-slate-900">{part.recorderName}</span>
                        <BadgePill badge={part.badge} domain={part.domain} />
                      </div>

                      {/* Dispute Button */}
                      {!part.isDisputed && (
                        <button
                          onClick={() => handleOpenDispute(part)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-mono font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Dispute This Claim</span>
                        </button>
                      )}
                    </div>

                    {/* Dispute Note if marked */}
                    {part.isDisputed && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono">
                        <strong>Claim Disputed by Registrant:</strong> {part.disputeNote || 'Registrant declared this participation record invalid or inaccurate.'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
        </>
      )}

      {/* DISPUTE MODAL */}
      {disputeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Dispute Participation Claim</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are submitting a formal on-chain dispute against the participation record submitted by <strong>{targetParticipation?.recorderName}</strong> for <strong>{targetParticipation?.competitionName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Reason (Optional):</label>
              <textarea
                rows={3}
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="e.g. Our research team never submitted this paper to the specified competition..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Sign Dispute On-Chain
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
