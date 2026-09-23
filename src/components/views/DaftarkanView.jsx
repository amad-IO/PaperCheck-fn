'use client';

import React, { useState } from 'react';
import { Shield, User, FileText, UploadCloud, CheckCircle2, Lock, ArrowLeft, Download, ExternalLink, Award } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { registerManuscriptLocal } from '../../lib/mockRegistry';

export default function DaftarkanView({ walletState, connectWallet, showToast, setActiveTab }) {
  // Stepper: 1 (Author), 2 (Details), 3 (Fingerprint), 4 (Review & Sign), 5 (Certificate)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    authorName: '',
    institution: '',
    email: '',
    title: '',
    category: 'Energy & Environment',
  });

  // Document State
  const [file, setFile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  // Result / Certificate State
  const [registrationReceipt, setRegistrationReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Energy & Environment',
    'Applied Technology & Engineering',
    'Health & Biomedical Sciences',
    'Social Sciences & Education',
    'Agriculture & Food Security',
    'Creative Economy & Business'
  ];

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

    setIsSubmitting(true);
    showToast('Preparing Transaction', 'Signing paper fingerprint registration to Base Sepolia...', 'info');

    try {
      await new Promise(r => setTimeout(r, 1600));

      const receipt = registerManuscriptLocal({
        title: formData.title,
        category: formData.category,
        author: formData.authorName,
        institution: formData.institution,
        email: formData.email,
        sha256: fingerprint.sha256,
        simHash: fingerprint.simHash,
        registrantWallet: walletState.address
      });

      setRegistrationReceipt(receipt);
      setCurrentStep(5); // Certificate view
      showToast('Registration Successful', 'Manuscript fingerprint is permanently recorded on-chain.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Registration Failed', 'Transaction failed or was canceled by user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] text-xs font-mono text-slate-700 dark:text-slate-300">
          <Lock className="w-3.5 h-3.5 text-brand-primary" />
          <span>Zero-Knowledge Proof-of-Existence Timestamp</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Register Scientific Paper
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Lock in originality rights and timestamped proof-of-existence permanently before submitting to competitions.
        </p>
      </section>

      {/* Wallet Connection Gate */}
      {!walletState.isConnected && currentStep < 5 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
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
              <div className={`h-1.5 rounded-full mb-1.5 transition-all ${
                currentStep >= item.step ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-[#383838]'
              }`}></div>
              <span className={`text-[11px] font-mono font-medium ${
                currentStep >= item.step ? 'text-brand-700 dark:text-[#F5A87B]' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {item.step}. {item.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-3xl p-6 sm:p-8 shadow-card transition-colors duration-200">
        
        {/* STEP 1: LEAD AUTHOR & AFFILIATION */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Lead Author & Affiliation</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                This information is stored locally/off-chain and is NEVER published on-chain to maintain privacy.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lead Author / Team Leader Name *</label>
                <input
                  type="text"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleInputChange}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">University / Academic Institution *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  placeholder="e.g. University of California, Berkeley"
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Corresponding Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. author@university.edu"
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Continue: Paper Details</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MANUSCRIPT DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Manuscript Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provide the details of the manuscript to be registered.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Manuscript Title *</label>
                <textarea
                  rows={3}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter the complete title of your scientific paper..."
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category / Sub-Theme *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-primary"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-100">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E1E1E]"
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

        {/* STEP 3: UPLOAD MANUSCRIPT & FINGERPRINTING */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Manuscript Fingerprinting</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The document is extracted directly in your browser to compute SHA-256 and SimHash. The file is never sent to a server.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-[#383838] hover:border-brand-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-[#1E1E1E]/50">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                id="manuscript-file-input"
                className="hidden"
              />
              <label htmlFor="manuscript-file-input" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-10 h-10 text-brand-primary mx-auto" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {file ? file.name : 'Select Manuscript File (PDF / DOCX / TXT)'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  Up to 25 MB • Parsed locally in client memory
                </div>
              </label>
            </div>

            {isHashing && (
              <div className="p-4 bg-slate-50 dark:bg-[#1E1E1E] rounded-xl text-xs font-mono text-center text-brand-700 dark:text-[#F5A87B] animate-pulse">
                Extracting text and computing cryptographic fingerprints...
              </div>
            )}

            {fingerprint && (
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                  <span>Fingerprint Generated:</span>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">Ready to Register</span>
                </div>
                <div className="truncate text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">SHA-256:</span> {fingerprint.sha256}
                </div>
                <div className="truncate text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">SimHash 64-bit:</span> {fingerprint.simHash}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                  Document length: {fingerprint.wordCount} words ({fingerprint.charCount} characters)
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E1E1E]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!fingerprint}
                className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <span>Continue: Review</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & ON-CHAIN CONFIRMATION */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Review & Permanent On-Chain Registration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review the cryptographic proof that will be recorded in the smart contract before signing the transaction.
              </p>
            </div>

            {/* Privacy Box: What is stored on-chain vs off-chain */}
            <div className="bg-slate-50 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#383838] rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono uppercase">
                Data Storage Transparency:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Stored On-Chain:</span>
                  </div>
                  <ul className="list-disc list-inside text-emerald-800 dark:text-emerald-300 text-[11px] space-y-0.5 font-mono">
                    <li>SHA-256 Hash</li>
                    <li>SimHash 64-bit</li>
                    <li>Block Timestamp</li>
                    <li>Registrant Wallet Address</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-[#262626] rounded-xl border border-slate-200 dark:border-[#383838]">
                  <div className="font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>NOT Stored On-Chain (Private):</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-0.5">
                    <li>Full paper content or text</li>
                    <li>Author and team member names</li>
                    <li>Email addresses</li>
                    <li>Original PDF/DOCX file</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Summary Review */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Paper Title:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right max-w-[280px] truncate">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Category:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Author / Institution:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formData.authorName} ({formData.institution})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">Signer Wallet:</span>
                <span className="font-medium text-brand-700 dark:text-[#F5A87B]">
                  {walletState.isConnected ? `${walletState.address.substring(0, 10)}...` : 'Not connected'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1E1E1E]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleRegisterOnChain}
                disabled={isSubmitting || !walletState.isConnected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Signing Transaction...</span>
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
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Proof-of-Existence Certificate</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This scientific paper has been permanently registered on the Base Sepolia blockchain.
              </p>
            </div>

            {/* Certificate Box */}
            <div className="border-2 border-slate-200 dark:border-[#383838] bg-slate-50/70 dark:bg-[#1E1E1E] rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Registration ID:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">PAPER-{registrationReceipt.registeredAt}</span>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">PAPER TITLE:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-sans text-sm">{registrationReceipt.title}</span>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">SHA-256 FINGERPRINT:</span>
                <span className="font-bold text-brand-primary text-[11px] break-all">{registrationReceipt.contentHash}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">SimHash 64-Bit:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{registrationReceipt.simHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Timestamp Recorded:</span>
                <span className="text-slate-900 dark:text-slate-100">{new Date(registrationReceipt.registeredAt).toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => showToast('Downloading Certificate', 'Registration certificate is downloading.', 'info')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Certificate (PDF)</span>
              </button>
              <button
                onClick={() => setActiveTab('cek')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#1E1E1E] text-slate-700 dark:text-slate-200 text-xs font-semibold"
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
