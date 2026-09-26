'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { checkManuscriptRegistry, mergeWithOnChainData } from '../../lib/mockRegistry';
import { fetchManuscriptsFromChain, CONTRACT_ADDRESS, getExplorerTxUrl, getExplorerAddressUrl } from '../../lib/contract';
import StatusCard from '../StatusCard';

export default function CekNaskahView({ showToast, walletState }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 1: extract, 2: hash, 3: query
  const [progressMessage, setProgressMessage] = useState('');
  const [inspectionResult, setInspectionResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Silent background sync with smart contract so similarity checks include latest on-chain manuscripts
    fetchManuscriptsFromChain({ contractAddress: CONTRACT_ADDRESS })
      .then((chainList) => {
        if (chainList && chainList.length > 0) {
          mergeWithOnChainData(chainList);
        }
      })
      .catch((err) => {
        console.warn('Silent on-chain sync in CekNaskah:', err?.message);
      });
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      showToast('Unsupported Format', 'Please upload a file with .pdf, .docx, or .txt extension.', 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('File Too Large', 'Maximum file size limit is 25 MB.', 'warning');
      return;
    }

    setSelectedFile(file);
    processDocument(file);
  };

  const processDocument = async (file) => {
    setIsProcessing(true);
    setInspectionResult(null);

    try {
      // Step 1: Text extraction in browser
      setProgressStep(1);
      setProgressMessage('Extracting document text in browser (private)...');
      await new Promise(r => setTimeout(r, 400));

      const rawText = await extractTextFromFile(file);

      if (!rawText || rawText.trim().length < 30) {
        throw new Error('Document text is too short or empty. Please ensure the file contains readable text.');
      }

      // Step 2: Hashing & SimHash
      setProgressStep(2);
      setProgressMessage('Computing cryptographic fingerprints (SHA-256 & SimHash 64-bit)...');
      await new Promise(r => setTimeout(r, 500));
      const fingerprint = await generateDocumentFingerprint(rawText);

      // Step 3: Query Smart Contract Registry
      setProgressStep(3);
      setProgressMessage('Matching fingerprint against on-chain registry...');
      await new Promise(r => setTimeout(r, 600));
      const result = await checkManuscriptRegistry(rawText);

      setInspectionResult(result);
      showToast('Verification Complete', 'Manuscript fingerprint successfully processed.', 'success');

    } catch (err) {
      console.error('Processing error:', err);
      showToast('Processing Failed', err.message || 'An error occurred while processing the manuscript.', 'error');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
      setProgressMessage('');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setInspectionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleViewExplorer = () => {
    const chainId = walletState?.chainId || 968;
    if (inspectionResult?.manuscript?.txHash) {
      window.open(getExplorerTxUrl(inspectionResult.manuscript.txHash, chainId), '_blank');
      return;
    }
    // Jika naskah berstatus bersih (belum terdaftar) atau belum ada txHash, buka alamat Smart Contract di explorer
    window.open(getExplorerAddressUrl(CONTRACT_ADDRESS, chainId), '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Hero Section */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl sm:rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-mono text-slate-700 text-center max-w-full">
          <Shield className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          <span className="hidden sm:inline">Serverless Client-Side Originality Verification</span>
          <span className="sm:hidden">Client-Side Originality Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Verify Academic Paper Integrity
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Independent verification protocol ensuring scientific manuscripts have not been previously submitted or awarded in other competitions.
        </p>
      </section>

      {/* Main Inspection Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6 transition-colors duration-200">
        
        {/* Header and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Upload Manuscript File</h2>
            <p className="text-xs text-slate-500 font-medium">Supports PDF, Word (.docx), or plain text (.txt) format</p>
          </div>

          {(selectedFile || inspectionResult) && (
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-full text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center gap-1.5 font-mono transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Drag & Drop File Upload */}
        <div className="space-y-3">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-brand-primary bg-brand-50/50 scale-[0.99]' 
                : selectedFile 
                ? 'border-slate-300 bg-slate-50/50' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <UploadCloud className="w-10 h-10 text-brand-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Drag & drop manuscript here, or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Supports PDF or Word (.docx, .txt) up to 25 MB
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Client-Side Privacy Guarantee:</strong> Your document is parsed and hashed locally in memory. The actual text is never uploaded to any server.
            </span>
          </div>
        </div>

        {/* Progress Bar & Indicators during Processing */}
        {isProcessing && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 font-semibold">{progressMessage}</span>
              <span className="text-brand-primary font-bold">Step {progressStep}/3</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-brand-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${(progressStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Inspection Results Card */}
        {inspectionResult && (
          <StatusCard 
            result={inspectionResult} 
            onViewExplorer={handleViewExplorer}
          />
        )}

      </div>

    </div>
  );
}
