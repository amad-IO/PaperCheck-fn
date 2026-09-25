'use client';

import React, { useState } from 'react';
import { Shield, User, FileText, UploadCloud, CheckCircle2, Lock, ArrowLeft, Download, ExternalLink, Award } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { registerManuscriptLocal } from '../../lib/mockRegistry';
import { registerManuscriptOnChain, getExplorerTxUrl } from '../../lib/contract';

export default function DaftarkanView({ walletState, connectWallet, showToast, setActiveTab }) {
  // Stepper: 1 (Author), 2 (Details), 3 (Fingerprint), 4 (Review & Sign), 5 (Certificate)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State (Category input field removed per request; defaults internally to 'General')
  const [formData, setFormData] = useState({
    authorName: '',
    institution: '',
    email: '',
    title: '',
    category: 'General',
  });

  // Document State
  const [file, setFile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  // Result / Certificate State
  const [registrationReceipt, setRegistrationReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsHashing(true);

      try {
        const text = await extractTextFromFile(selectedFile);
        if (!text || text.trim().length < 30) {
          throw new Error('Document is empty or contains no readable text.');
        }

        const fp = await generateDocumentFingerprint(text);
        setFingerprint(fp);
        showToast('Fingerprint Generated', 'SHA-256 and SimHash computed successfully.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Fingerprint Generation Failed', err.message, 'error');
        setFile(null);
        setFingerprint(null);
      } finally {
        setIsHashing(false);
      }
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.authorName.trim() || !formData.institution.trim()) {
        showToast('Incomplete Fields', 'Please provide the lead author name and institution.', 'warning');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.title.trim()) {
        showToast('Title Required', 'Please enter the full paper title.', 'warning');
        return;
      }
    } else if (currentStep === 3) {
      if (!fingerprint) {
        showToast('Upload Required', 'Please upload a manuscript to generate its fingerprint.', 'warning');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleRegisterOnChain = async () => {
    if (!walletState.isConnected) {
      showToast('Wallet Connection Required', 'Please connect your crypto wallet to continue.', 'warning');
      connectWallet();
      return;
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      showToast('MetaMask Required', 'Please install or unlock MetaMask to sign this on-chain transaction.', 'error');
      return;
    }

    setIsSubmitting(true);
    showToast('Confirm in Wallet', 'Please confirm the registration transaction in your MetaMask wallet popup...', 'info');

    try {
      const result = await registerManuscriptOnChain({
        title: formData.title,
        category: formData.category || 'General',
        author: formData.authorName,
        institution: formData.institution,
        sha256: fingerprint.sha256,
        simHash: fingerprint.simHash,
        userAddress: walletState.address,
        onTxSent: (txHash) => {
          showToast('Transaction Broadcasted', `Transaction sent (${txHash.substring(0, 8)}...). Awaiting block confirmation...`, 'info');
        }
      });

      const receipt = registerManuscriptLocal({
        title: formData.title,
        category: formData.category || 'General',
        author: formData.authorName,
        institution: formData.institution,
        email: formData.email,
        sha256: fingerprint.sha256,
        simHash: fingerprint.simHash,
        registrantWallet: walletState.address,
        txHash: result.txHash,
        blockNumber: result.blockNumber
      });

      setRegistrationReceipt({
        ...receipt,
        txHash: result.txHash,
        blockNumber: result.blockNumber
      });

      setCurrentStep(5);
      showToast('Registration Confirmed', 'Manuscript timestamp is permanently recorded on the smart contract!', 'success');
    } catch (err) {
      console.error('Registration on-chain failed:', err);
      let errorMsg = 'Failed to register manuscript on blockchain.';
      if (err?.code === 4001 || err?.message?.includes('User rejected') || err?.message?.includes('rejected')) {
        errorMsg = 'Transaction was rejected in your wallet.';
      } else if (err?.message?.includes('ManuscriptAlreadyExists') || err?.message?.includes('already exists')) {
        errorMsg = 'This manuscript fingerprint has already been recorded on the blockchain.';
      } else if (err?.message) {
        errorMsg = err.message.slice(0, 100);
      }
      showToast('Transaction Error', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <Lock className="w-3.5 h-3.5 text-brand-primary" />
          <span>Zero-Knowledge Proof-of-Existence Timestamp</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Register Scientific Paper
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Lock in originality rights and timestamped proof-of-existence permanently before submitting to competitions.
        </p>
      </section>

      {/* Wallet Connection Gate */}
      {!walletState.isConnected && currentStep < 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-xs text-amber-900">
              <strong>Connection Required:</strong> You must connect your wallet to sign the on-chain timestamped proof.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shrink-0 shadow-sm"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Stepper Progress Indicator */}
      {currentStep <= 4 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Author Info' },
            { step: 2, title: 'Details' },
            { step: 3, title: 'Fingerprint' },
            { step: 4, title: 'Review & Sign' }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`h-1.5 rounded-full mb-1.5 transition-all ${currentStep >= item.step ? 'bg-brand-primary' : 'bg-slate-200'
                }`}></div>
              <span className={`text-[11px] font-mono font-medium ${currentStep >= item.step ? 'text-brand-700' : 'text-slate-400'
                }`}>
                {item.step}. {item.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">

        {/* STEP 1: AUTHOR INFO */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Author Identity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The lead author will be tied to this registration as the primary proof-of-ownership claimant.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Author Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="authorName"
                    value={formData.authorName}
                    onChange={handleInputChange}
                    placeholder="e.g. Andi Pratama / Research Team"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliated Institution / University *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  placeholder="e.g. State University of Makassar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. research@institution.ac.id"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Continue: Manuscript Details</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MANUSCRIPT DETAILS (Category input field removed per request) */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Manuscript Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide the title of the manuscript to be registered.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Manuscript Title *</label>
                <textarea
                  rows={4}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter the complete title of your scientific paper..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Continue: Upload Paper</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: UPLOAD FILE & GENERATE FINGERPRINT */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Document Upload & Zero-Knowledge Hashing</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your PDF or Word document. Cryptographic fingerprints are generated entirely inside your browser.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                <UploadCloud className="w-10 h-10 text-brand-primary" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : 'Select PDF or Word File'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Client-side extraction • File is never sent across network
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-sm">
                  {file ? 'Replace File' : 'Browse File'}
                </span>
              </label>
            </div>

            {isHashing && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs font-mono text-[#C2410C] flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping"></span>
                <span>Calculating SHA-256 and SimHash in browser...</span>
              </div>
            )}

            {fingerprint && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 font-mono text-xs">
                <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dual-Fingerprint Generated Successfully:</span>
                </div>
                <div className="text-slate-600 break-all">
                  <span className="text-emerald-700 font-semibold block text-[10px]">SHA-256 (32 Bytes):</span>
                  {fingerprint.sha256}
                </div>
                <div className="text-slate-600">
                  <span className="text-emerald-700 font-semibold block text-[10px]">SimHash (64-Bit):</span>
                  {fingerprint.simHash}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!fingerprint}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <span>Continue: Review & Sign</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SIGN ON-CHAIN */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">4. Review & On-Chain Signature</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify the registration parameters before signing with your connected Web3 wallet.
              </p>
            </div>

            {/* Privacy Matrix Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">Recorded to Smart Contract:</span>
                <ul className="text-emerald-800 space-y-1 list-disc list-inside text-[11px] font-mono">
                  <li>SHA-256 Document Hash</li>
                  <li>SimHash 64-Bit Fingerprint</li>
                  <li>Title & Timestamp</li>
                  <li>Owner Wallet Address</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Kept Private (Never On-Chain):</span>
                <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                  <li>Manuscript body text</li>
                  <li>Author and team member names</li>
                  <li>Email addresses</li>
                  <li>Original PDF/DOCX file</li>
                </ul>
              </div>
            </div>

            {/* Summary Review (Category row removed per request) */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Paper Title:</span>
                <span className="font-bold text-slate-900 text-right max-w-[280px] truncate">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Author / Institution:</span>
                <span className="font-medium text-slate-900">{formData.authorName} ({formData.institution})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Signer Wallet:</span>
                <span className="font-medium text-brand-700">
                  {walletState.isConnected ? `${walletState.address.substring(0, 10)}...` : 'Not connected'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleRegisterOnChain}
                disabled={isSubmitting || !walletState.isConnected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Signing & Confirming On-Chain...</span>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Register Paper On-Chain</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS CERTIFICATE VIEW */}
        {currentStep === 5 && registrationReceipt && (
          <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Proof-of-Existence Certificate</h2>
              <p className="text-xs text-slate-500 mt-1">
                This scientific paper has been permanently registered on the blockchain smart contract.
              </p>
            </div>

            {/* Certificate Box */}
            <div className="border-2 border-slate-200 bg-slate-50/70 rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Registration ID:</span>
                <span className="font-bold text-slate-900">PAPER-{registrationReceipt.registeredAt}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px]">PAPER TITLE:</span>
                <span className="font-bold text-slate-900 font-sans text-sm">{registrationReceipt.title}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px]">SHA-256 FINGERPRINT:</span>
                <span className="font-bold text-brand-primary text-[11px] break-all">{registrationReceipt.contentHash}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500">SimHash 64-Bit:</span>
                <span className="font-bold text-slate-900">{registrationReceipt.simHash}</span>
              </div>
              {registrationReceipt.txHash && (
                <div className="border-b border-slate-200 pb-2">
                  <span className="text-slate-500 block text-[10px]">ON-CHAIN TRANSACTION HASH:</span>
                  <a
                    href={getExplorerTxUrl(registrationReceipt.txHash, walletState.chainId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-brand-primary text-[11px] break-all underline hover:text-brand-600 flex items-center gap-1.5 mt-0.5"
                  >
                    <span>{registrationReceipt.txHash}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
              {registrationReceipt.blockNumber && (
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Block Number:</span>
                  <span className="font-bold text-slate-900">#{registrationReceipt.blockNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp Recorded:</span>
                <span className="text-slate-900">{new Date(registrationReceipt.registeredAt).toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {registrationReceipt.txHash && (
                <a
                  href={getExplorerTxUrl(registrationReceipt.txHash, walletState.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View On Explorer</span>
                </a>
              )}
              <button
                onClick={() => showToast('Downloading Certificate', 'Registration certificate is downloading.', 'info')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Certificate (PDF)</span>
              </button>
              <button
                onClick={() => setActiveTab('cek')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                Return to Check Page
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
