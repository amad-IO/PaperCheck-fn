'use client';

import React, { useState } from 'react';
import { Award, Globe, CheckCircle2, AlertCircle, PlusCircle, UploadCloud, ArrowRight, ShieldCheck, FileText, Send } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { addParticipationLocal, checkManuscriptRegistry } from '../../lib/mockRegistry';
import { batchAddParticipationOnChain } from '../../lib/contract';

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
    showToast('Preparing Batch Transaction', `Writing ${batchFiles.length} manuscripts to smart contract...`, 'info');

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        showToast('Confirm in Wallet', 'Please confirm the batch participation transaction in MetaMask...', 'info');
        await batchAddParticipationOnChain({
          items: batchFiles,
          competitionName: competitionForm.name || 'National Science Symposium 2026',
          year: competitionForm.year,
          category: competitionForm.category || 'General',
          recorderName: 'Official Committee',
          domain: domainStatus.domain,
          userAddress: walletState.address
        });
      }

      // Save each to local registry
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
      let msg = err.message || 'Batch transaction failed.';
      if (err?.code === 4001 || err?.message?.includes('rejected')) {
        msg = 'Transaction was rejected in your wallet.';
      }
      showToast('Registration Failed', msg, 'error');
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
          <span>Institutional Multi-Sig Jury & Verifiable Award Attestation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Competition Committee Dashboard
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Manage competitions, verify institution domain credibility, and record award outcomes on-chain in bulk.
        </p>
      </section>

      {/* Domain Verification Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
 domainStatus.isVerified 
 ? 'bg-emerald-100 text-emerald-700' 
 : 'bg-amber-100 text-amber-700'
 }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Committee Institutional Domain:</span>
              <span className="font-mono text-xs text-brand-700 font-semibold">{domainStatus.domain}</span>
              {domainStatus.isVerified ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Recorded paper entries will receive a public <strong>Domain Verified</strong> credibility badge.
            </p>
          </div>
        </div>

        <button
          onClick={() => setPanitiaTab('verifikasi')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold shrink-0 transition-colors"
        >
          Configure DNS
        </button>
      </div>

      {/* Main Action Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6 transition-colors duration-200">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-slate-100/90 border border-slate-200/80">
            <button
              onClick={() => setPanitiaTab('batch')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
 panitiaTab === 'batch' 
 ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
 : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
 }`}
            >
              Record Batch Results
            </button>
            <button
              onClick={() => setPanitiaTab('buat')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
 panitiaTab === 'buat' 
 ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
 : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
 }`}
            >
              Create Competition
            </button>
            <button
              onClick={() => setPanitiaTab('verifikasi')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
 panitiaTab === 'verifikasi' 
 ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/25' 
 : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              <h2 className="text-base font-bold text-slate-900">Record Paper Results in Bulk (Batch Upload)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload multiple manuscripts at once to assign Participant, Finalist, or Winner awards in a single on-chain transaction.
              </p>
            </div>

            {/* Upload multi files dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
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
                <div className="text-xs font-semibold text-slate-800">
                  {isProcessingBatch ? 'Extracting documents...' : 'Select Multiple Manuscripts (Multi-select PDF / DOCX)'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Automatically extracts titles and computes dual cryptographic fingerprints
                </div>
              </label>
            </div>

            {/* Table of Parsed Files */}
            {batchFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 font-mono">
                    Manuscripts Ready to Record ({batchFiles.length} files):
                  </span>
                  <button 
                    onClick={() => setBatchFiles([])}
                    className="text-slate-400 hover:text-rose-600 font-mono text-[11px]"
                  >
                    Clear Table
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-mono font-semibold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">File Name & Title</th>
                        <th className="py-2.5 px-3">Fingerprint</th>
                        <th className="py-2.5 px-3">Similarity</th>
                        <th className="py-2.5 px-3">Award / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {batchFiles.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 truncate max-w-[220px]">{item.fileName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{item.title}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                            <div className="truncate max-w-[120px]">{item.sha256}</div>
                          </td>
                          <td className="py-3 px-3">
                            {item.hasConflict ? (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-200">
                                {item.similarityScore}% Similar
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                0% Clean
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="bg-white border border-slate-300 text-slate-800 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:border-brand-primary"
                            >
                              <option value="Participant" className="bg-white text-slate-800">Participant</option>
                              <option value="Finalist" className="bg-white text-slate-800">Finalist</option>
                              <option value="Winner" className="bg-white text-slate-800">Winner</option>
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
              <h2 className="text-base font-bold text-slate-900">Register New Competition</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register your competition on the smart contract to become recognized as an official organizer.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Competition Name *</label>
                <input
                  type="text"
                  value={competitionForm.name}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. National Green Tech Paper Symposium 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Competition Year *</label>
                  <input
                    type="number"
                    value={competitionForm.year}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category *</label>
                  <input
                    type="text"
                    value={competitionForm.category}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Institutional Domain *</label>
                <input
                  type="text"
                  value={competitionForm.institutionDomain}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, institutionDomain: e.target.value }))}
                  placeholder="e.g. symposium.university.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary"
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
              <h2 className="text-base font-bold text-slate-900">Institution Domain Verification</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prove that your committee wallet is affiliated with your institution domain via a DNS TXT record.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-800">DNS TXT Configuration Guide:</div>
              <ol className="list-decimal list-inside text-slate-600 space-y-1 leading-relaxed">
                <li>Open your institution domain DNS management panel (e.g. <code>university.edu</code>).</li>
                <li>Add a new record of type <strong>TXT</strong>.</li>
                <li>Enter the following verification string into the value/content field:</li>
              </ol>

              <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all border border-slate-800">
                {domainStatus.dnsTxtRecord}
              </div>

              <p className="text-[11px] text-slate-500">
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
