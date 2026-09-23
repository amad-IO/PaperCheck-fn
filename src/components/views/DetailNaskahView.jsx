'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Hash, ShieldAlert, CheckCircle2, User, ExternalLink, ShieldCheck, AlertCircle, History, ChevronDown, Check } from 'lucide-react';
import { getRegistry, disputeClaimLocal, INITIAL_REGISTRY } from '../../lib/mockRegistry';
import BadgePill from '../BadgePill';

export default function DetailNaskahView({ walletState, showToast }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  useEffect(() => {
    const list = getRegistry();
    setRegistryList(list);
    if (list.length > 0) {
      setSelectedHash((prev) => prev || list[0].contentHash);
      setCurrentManuscript((prev) => prev || list[0]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectManuscript = (hash) => {
    setSelectedHash(hash);
    const found = registryList.find(item => item.contentHash === hash);
    setCurrentManuscript(found || null);
  };

  const handleOpenDispute = (part) => {
    // Check if the current connected wallet is the original registrant
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

  const submitDispute = () => {
    if (!targetParticipation || !currentManuscript) return;

    const success = disputeClaimLocal(
      currentManuscript.contentHash, 
      targetParticipation.id, 
      disputeNote || 'Disputed by original registrant.'
    );

    if (success) {
      showToast('Dispute Recorded', 'This participation record is now flagged as "Disputed" on the smart contract.', 'success');
      // Refresh
      const updatedList = getRegistry();
      setRegistryList(updatedList);
      const updatedCurrent = updatedList.find(item => item.contentHash === currentManuscript.contentHash);
      setCurrentManuscript(updatedCurrent);
    }

    setDisputeModalOpen(false);
    setDisputeNote('');
  };

  const isOwner = walletState.isConnected && 
    walletState.address.toLowerCase() === (currentManuscript?.registrant || '').toLowerCase();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] text-xs font-mono text-slate-700 dark:text-slate-300">
          <History className="w-3.5 h-3.5 text-brand-primary" />
          <span>Immutable Public Audit Trail & Dispute Resolution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Paper Details & Competition Track Record
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Audit chronological history of competition participation and resolve unilateral claims.
        </p>
      </section>

      {/* Select / Search Paper Bar */}
      <div className="bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30 transition-colors">
        <div className="flex items-center gap-2.5 w-full sm:w-auto relative" ref={dropdownRef}>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">Select Paper:</span>
          
          <div className="relative w-full sm:w-80">
            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full bg-slate-50 dark:bg-[#1E1E1E] hover:bg-slate-100/80 dark:hover:bg-[#242424] border border-slate-200 dark:border-[#383838] rounded-xl py-2 px-3 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center justify-between gap-2 text-left transition-all focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <span className="truncate max-w-[240px]">
                {currentManuscript?.title || 'Select a manuscript...'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-brand-primary' : ''}`} />
            </button>

            {/* Custom Dropdown Popover */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full sm:w-[380px] bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#383838]">
                  {registryList.map((item) => {
                    const isSelected = item.contentHash === selectedHash;
                    return (
                      <button
                        key={item.contentHash}
                        type="button"
                        onClick={() => {
                          handleSelectManuscript(item.contentHash);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-orange-50/70 dark:bg-orange-950/40 text-slate-900 dark:text-white font-semibold border-l-2 border-brand-primary'
                            : 'hover:bg-slate-50 dark:hover:bg-[#1E1E1E] text-slate-700 dark:text-slate-300 font-normal'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <p className={`text-xs truncate ${isSelected ? 'text-brand-700 dark:text-[#F5A87B] font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.author}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {currentManuscript && (
          <div className="text-xs font-mono text-slate-500">
            {isOwner ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Connected as Original Author
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Public Preview Mode</span>
            )}
          </div>
        )}
      </div>

      {currentManuscript && (
        <div className="bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-3xl p-6 sm:p-8 shadow-card space-y-6 transition-colors duration-200">
          
          {/* Metadata Header */}
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#383838] uppercase">
                {currentManuscript.category}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Registered: {new Date(currentManuscript.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentManuscript.title}
            </h2>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 dark:text-slate-400 font-mono pt-1">
              <div>Author: <strong className="text-slate-900 dark:text-slate-100">{currentManuscript.author}</strong></div>
              <div>Institution: <strong className="text-slate-900 dark:text-slate-100">{currentManuscript.institution}</strong></div>
              <div className="truncate max-w-xs">
                Registrant: <span className="text-brand-700 dark:text-[#F5A87B]">{currentManuscript.registrant}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Content Hash (SHA-256)</span>
              <div className="text-[11px] text-brand-700 dark:text-[#F5A87B] font-bold break-all">{currentManuscript.contentHash}</div>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">SimHash 64-Bit Fingerprint</span>
              <div className="text-[11px] text-slate-800 dark:text-slate-200 font-bold">{currentManuscript.simHash}</div>
            </div>
          </div>

          {/* Participation Track Record (Timeline) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Participation Track Record ({currentManuscript.participations?.length || 0} Events):
            </h3>

            {(!currentManuscript.participations || currentManuscript.participations.length === 0) ? (
              <div className="p-6 bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                No organizers have recorded participation for this manuscript yet.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3.5 sm:ml-4 space-y-6 pb-2">
                {currentManuscript.participations.map((part) => (
                  <div key={part.id} className="relative pl-6 sm:pl-8">
                    {/* Timeline Node */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-[#1E1E1E] border-4 border-brand-primary"></div>

                    {/* Timeline Card */}
                    <div className="bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{part.competitionName}</h4>
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">({part.year})</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Category: {part.category}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold self-start sm:self-auto ${
                          part.status === 'Winner' || part.status === 'Juara'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                            : part.status === 'Finalist' || part.status === 'Finalis'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383838]'
                        }`}>
                          Status: {part.status === 'Juara' ? 'Winner' : (part.status === 'Finalis' ? 'Finalist' : part.status === 'Peserta' ? 'Participant' : part.status)}
                        </span>
                      </div>

                      {/* Source & Credibility */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Recorded By:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{part.recorderName}</span>
                          <BadgePill badge={part.badge} domain={part.domain} />
                        </div>

                        {/* Dispute Button */}
                        {!part.isDisputed && (
                          <button
                            onClick={() => handleOpenDispute(part)}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-mono font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Dispute This Claim</span>
                          </button>
                        )}
                      </div>

                      {/* Dispute Note if marked */}
                      {part.isDisputed && (
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-mono">
                          <strong>Claim Disputed by Registrant:</strong> {part.disputeNote || 'Registrant declared this participation record invalid or inaccurate.'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#262626] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-[#383838]">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Dispute Participation Claim</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You are submitting a formal on-chain dispute against the participation record submitted by <strong>{targetParticipation?.recorderName}</strong> for <strong>{targetParticipation?.competitionName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dispute Reason (Optional):</label>
              <textarea
                rows={3}
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="e.g. Our research team never submitted this paper to the specified competition..."
                className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E1E1E]"
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
