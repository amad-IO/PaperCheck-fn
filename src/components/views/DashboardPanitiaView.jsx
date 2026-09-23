'use client';

import React, { useState } from 'react';
import { Award, Globe, CheckCircle2, AlertCircle, PlusCircle, UploadCloud, ArrowRight, ShieldCheck, FileText, Send } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { addParticipationLocal, checkManuscriptRegistry } from '../../lib/mockRegistry';

export default function DashboardPanitiaView({ walletState, connectWallet, showToast, setActiveTab }) {
  const [panitiaTab, setPanitiaTab] = useState('batch'); // 'batch' | 'buat' | 'verifikasi'

  // Competition Creation Form State
  const [competitionForm, setCompetitionForm] = useState({
    name: '',
    year: new Date().getFullYear().toString(),
    category: 'Technology & Innovation',
    institutionDomain: 'symposium.university.edu'
  });

  // Domain Verification State
  const [domainStatus, setDomainStatus] = useState({
    domain: 'symposium.university.edu',
    isVerified: true,
    dnsTxtRecord: `papercheck-verify=${walletState.address || '0x71C8364437a90961f84582042a552746b34571Cd'}`
  });
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);

  // Batch Upload State
  const [batchFiles, setBatchFiles] = useState([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Handle Multi-file Upload for Batch Results
  const handleBatchUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setIsProcessingBatch(true);
    showToast('Processing Files', `Extracting text from ${files.length} manuscripts...`, 'info');

    try {
      const parsedList = [];

      for (const file of files) {
        try {
          const text = await extractTextFromFile(file);
          const fp = await generateDocumentFingerprint(text);
          const registryCheck = await checkManuscriptRegistry(text);

          // Infer title from file name
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

          parsedList.push({
            id: Math.random().toString(36).substring(7),
            fileName: file.name,
            title: cleanTitle,
            sha256: fp.sha256,
            simHash: fp.simHash,
            status: 'Participant', // Default: Participant | Finalist | Winner
            similarityScore: registryCheck.similarityPercentage || 0,
            hasConflict: registryCheck.status !== 'clean'
          });
        } catch (err) {
          console.warn(`Failed to process file ${file.name}:`, err);
        }
      }

      setBatchFiles(prev => [...prev, ...parsedList]);
      showToast('Parsing Complete', `${parsedList.length} manuscripts ready to record on-chain.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Batch Processing Failed', err.message, 'error');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setBatchFiles(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleBatchSubmit = async () => {
    if (!walletState.isConnected) {
      showToast('Connection Required', 'Connect committee wallet to sign bulk registrations.', 'warning');
      connectWallet();
      return;
    }

    if (batchFiles.length === 0) {
      showToast('No Files Uploaded', 'Please upload manuscript files first.', 'warning');
      return;
    }

    setIsSubmittingBatch(true);
    showToast('Preparing Batch Transaction', `Writing ${batchFiles.length} manuscripts on-chain via Base Sepolia...`, 'info');

    try {
      await new Promise(r => setTimeout(r, 2000));

      // Save each to local mock registry
      for (const item of batchFiles) {
        addParticipationLocal({
          contentHash: item.sha256,
          competitionName: competitionForm.name || 'National Science Symposium 2026',
          year: competitionForm.year,
          category: competitionForm.category,
          status: item.status,
          recordedBy: walletState.address,
          recorderName: 'Official Committee',
          domain: domainStatus.domain,
          badge: domainStatus.isVerified ? 'domain_verified' : 'anonymous'
        });
      }

      showToast('Batch Recorded Successfully', `All ${batchFiles.length} manuscripts have been permanently recorded.`, 'success');
      setBatchFiles([]);
    } catch (err) {
      console.error(err);
      showToast('Registration Failed', err.message, 'error');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsCheckingDomain(true);
    showToast('Checking DNS TXT', `Querying nameservers for domain ${domainStatus.domain}...`, 'info');

    setTimeout(() => {
      setIsCheckingDomain(false);
      setDomainStatus(prev => ({ ...prev, isVerified: true }));
      showToast('Domain Verified', `DNS TXT record matches wallet ${walletState.address ? walletState.address.substring(0, 6) + '...' : 'committee'}.`, 'success');
    }, 1800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] text-xs font-mono text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
          <span>Institutional Multi-Sig Jury & Verifiable Award Attestation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Competition Committee Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Manage competitions, verify institution domain credibility, and record award outcomes on-chain in bulk.
        </p>
      </section>

      {/* Domain Verification Notice Banner */}
      <div className="bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            domainStatus.isVerified 
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Committee Institutional Domain:</span>
              <span className="font-mono text-xs text-brand-700 dark:text-[#F5A87B] font-semibold">{domainStatus.domain}</span>
              {domainStatus.isVerified ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  Verified
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Recorded paper entries will receive a public <strong>Domain Verified</strong> credibility badge.
            </p>
          </div>
        </div>

        <button
          onClick={() => setPanitiaTab('verifikasi')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#383838] hover:bg-white dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 transition-colors"
        >
          Configure DNS
        </button>
      </div>

      {/* Main Action Tabs */}
      <div className="bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-3xl p-6 sm:p-8 shadow-card space-y-6 transition-colors duration-200">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-slate-100/90 dark:bg-[#1E1E1E] border border-slate-200/80 dark:border-[#383838]">
            <button
              onClick={() => setPanitiaTab('batch')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                panitiaTab === 'batch' 
                  ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              Record Batch Results
            </button>
            <button
              onClick={() => setPanitiaTab('buat')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                panitiaTab === 'buat' 
                  ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              Create Competition
            </button>
            <button
              onClick={() => setPanitiaTab('verifikasi')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                panitiaTab === 'verifikasi' 
                  ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              Domain Verification (DNS)
            </button>
          </div>
        </div>

        {/* TAB 1: RECORD BATCH RESULTS (MULTI-FILE UPLOAD) */}
        {panitiaTab === 'batch' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Record Paper Results in Bulk (Batch Upload)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload multiple manuscripts at once to assign Participant, Finalist, or Winner awards in a single on-chain transaction.
              </p>
            </div>

            {/* Upload multi files dropzone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-[#383838] hover:border-brand-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-[#1E1E1E]/50">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleBatchUpload}
                id="batch-file-input"
                className="hidden"
              />
              <label htmlFor="batch-file-input" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-9 h-9 text-brand-primary mx-auto" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isProcessingBatch ? 'Extracting documents...' : 'Select Multiple Manuscripts (Multi-select PDF / DOCX)'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  Automatically extracts titles and computes dual cryptographic fingerprints
                </div>
              </label>
            </div>

            {/* Table of Parsed Files */}
            {batchFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    Manuscripts Ready to Record ({batchFiles.length} files):
                  </span>
                  <button 
                    onClick={() => setBatchFiles([])}
                    className="text-slate-400 hover:text-rose-600 font-mono text-[11px]"
                  >
                    Clear Table
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-[#383838] rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-[#383838] font-mono font-semibold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">File Name & Title</th>
                        <th className="py-2.5 px-3">Fingerprint</th>
                        <th className="py-2.5 px-3">Similarity</th>
                        <th className="py-2.5 px-3">Award / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#383838] text-slate-700 dark:text-slate-300">
                      {batchFiles.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1E1E1E]/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">{item.fileName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{item.title}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="truncate max-w-[120px]">{item.sha256}</div>
                          </td>
                          <td className="py-3 px-3">
                            {item.hasConflict ? (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800/40">
                                {item.similarityScore}% Similar
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                0% Clean
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="bg-white dark:bg-[#1E1E1E] border border-slate-300 dark:border-[#383838] text-slate-800 dark:text-slate-200 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:border-brand-primary"
                            >
                              <option value="Participant" className="bg-white dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-200">Participant</option>
                              <option value="Finalist" className="bg-white dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-200">Finalist</option>
                              <option value="Winner" className="bg-white dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-200">Winner</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleBatchSubmit}
                    disabled={isSubmittingBatch}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingBatch ? 'Writing On-Chain...' : 'Submit Bulk Records On-Chain'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE COMPETITION */}
        {panitiaTab === 'buat' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Register New Competition</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register your competition on the smart contract to become recognized as an official organizer.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Competition Name *</label>
                <input
                  type="text"
                  value={competitionForm.name}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. National Green Tech Paper Symposium 2026"
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Competition Year *</label>
                  <input
                    type="number"
                    value={competitionForm.year}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Category *</label>
                  <input
                    type="text"
                    value={competitionForm.category}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Institutional Domain *</label>
                <input
                  type="text"
                  value={competitionForm.institutionDomain}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, institutionDomain: e.target.value }))}
                  placeholder="e.g. symposium.university.edu"
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <button
              onClick={() => showToast('Competition Registered', 'Competition successfully registered on the smart contract registry.', 'success')}
              className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Save & Register Competition On-Chain</span>
            </button>
          </div>
        )}

        {/* TAB 3: DOMAIN VERIFICATION (DNS TXT) */}
        {panitiaTab === 'verifikasi' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Institution Domain Verification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prove that your committee wallet is affiliated with your institution domain via a DNS TXT record.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">DNS TXT Configuration Guide:</div>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                <li>Open your institution domain DNS management panel (e.g. <code>university.edu</code>).</li>
                <li>Add a new record of type <strong>TXT</strong>.</li>
                <li>Enter the following verification string into the value/content field:</li>
              </ol>

              <div className="p-2.5 bg-slate-900 dark:bg-black/70 text-emerald-400 font-mono text-[11px] rounded-lg break-all border border-slate-800 dark:border-[#383838]">
                {domainStatus.dnsTxtRecord}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Once the DNS record is propagated, click the button below to verify automatically.
              </p>
            </div>

            <button
              onClick={handleVerifyDomain}
              disabled={isCheckingDomain}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isCheckingDomain ? 'Querying Nameservers...' : 'Verify Domain Now'}</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
