'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Search, ArrowRight, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { checkManuscriptRegistry, SAMPLE_ABSTRACTS } from '../../lib/mockRegistry';
import StatusCard from '../StatusCard';

export default function CekNaskahView({ showToast }) {
  const [activeInputMode, setActiveInputMode] = useState('upload'); // 'upload' | 'text'
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [abstractText, setAbstractText] = useState('');
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 1: extract, 2: hash, 3: query
  const [progressMessage, setProgressMessage] = useState('');
  const [inspectionResult, setInspectionResult] = useState(null);

  const fileInputRef = useRef(null);

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
      showToast('Format Tidak Didukung', 'Harap masukkan berkas dengan ekstensi .pdf atau .docx', 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('Ukuran Terlalu Besar', 'Batas ukuran berkas maksimal 25 MB.', 'warning');
      return;
    }

    setSelectedFile(file);
    processDocument(file);
  };

  const processDocument = async (fileOrText) => {
    setIsProcessing(true);
    setInspectionResult(null);

    try {
      let rawText = '';

      // Step 1: Ekstraksi Teks di Browser
      setProgressStep(1);
      setProgressMessage('Mengekstrak teks dokumen di browser (privat)...');
      await new Promise(r => setTimeout(r, 400));

      if (typeof fileOrText === 'string') {
        rawText = fileOrText;
      } else {
        rawText = await extractTextFromFile(fileOrText);
      }

      if (!rawText || rawText.trim().length < 30) {
        throw new Error('Teks dokumen terlalu pendek atau kosong. Pastikan dokumen berisi teks bacaan.');
      }

      // Step 2: Hashing & SimHash
      setProgressStep(2);
      setProgressMessage('Menghitung sidik jari kriptografis (SHA-256 & SimHash 64-bit)...');
      await new Promise(r => setTimeout(r, 500));
      const fingerprint = await generateDocumentFingerprint(rawText);

      // Step 3: Query Smart Contract Registry
      setProgressStep(3);
      setProgressMessage('Mencocokkan sidik jari dengan registry on-chain...');
      await new Promise(r => setTimeout(r, 600));
      const result = await checkManuscriptRegistry(rawText);

      setInspectionResult(result);
      showToast('Pemeriksaan Selesai', 'Sidik jari naskah berhasil diproses.', 'success');

    } catch (err) {
      console.error('Processing error:', err);
      showToast('Gagal Memproses', err.message || 'Terjadi kesalahan saat memproses naskah.', 'error');
    } finally {
      setIsProcessing(false);
      setProgressStep(0);
      setProgressMessage('');
    }
  };

  const handleManualCheck = () => {
    if (!abstractText || abstractText.trim().length < 50) {
      showToast('Teks Kurang', 'Masukkan minimal 50 karakter abstrak untuk dianalisis.', 'warning');
      return;
    }
    processDocument(abstractText);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAbstractText('');
    setInspectionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadPreset = (presetKey) => {
    const text = SAMPLE_ABSTRACTS[presetKey];
    setActiveInputMode('text');
    setAbstractText(text);
    processDocument(text);
  };

  const handleDownloadPdf = () => {
    showToast('Laporan Siap', 'Laporan verifikasi integritas naskah sedang diunduh.', 'info');
  };

  const handleViewExplorer = () => {
    const hash = inspectionResult?.sha256 || '0x';
    window.open(`https://sepolia.basescan.org/tx/${hash}`, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Hero Section */}
      <section className="text-center space-y-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <Shield className="w-3.5 h-3.5 text-brand-primary" />
          <span>Verifikasi Orisinalitas Naskah Tanpa Server</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Cek Riwayat Naskah LKTI
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Pemeriksaan independen untuk memastikan naskah karya tulis ilmiah belum pernah diajukan atau menjuarai kompetisi lain di tingkat nasional.
        </p>

        {/* Quick Test Presets */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Uji Cepat Contoh:</span>
          <button 
            onClick={() => loadPreset('SAMPLE_CLEAN')}
            className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-emerald-800 text-xs font-medium shadow-sm transition-all"
          >
            Contoh Naskah Bersih
          </button>
          <button 
            onClick={() => loadPreset('SAMPLE_A')}
            className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-amber-800 text-xs font-medium shadow-sm transition-all"
          >
            Contoh Pernah Ikut (PIMNAS)
          </button>
          <button 
            onClick={() => loadPreset('SAMPLE_A_PARAPHRASED')}
            className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-rose-800 text-xs font-medium shadow-sm transition-all"
          >
            Contoh Mirip Naskah Lain
          </button>
        </div>
      </section>

      {/* Main Inspection Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        
        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveInputMode('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeInputMode === 'upload' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unggah Dokumen (PDF / DOCX)
            </button>
            <button
              onClick={() => setActiveInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeInputMode === 'text' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tempel Abstrak
            </button>
          </div>

          {(selectedFile || abstractText || inspectionResult) && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* INPUT MODE 1: DRAG & DROP FILE */}
        {activeInputMode === 'upload' && (
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
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-primary flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Tarik & letakkan naskah di sini, atau klik untuk memilih berkas'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Mendukung format PDF atau Word (.docx) hingga 25 MB
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Jaminan Privasi:</strong> Naskahmu diproses langsung di browser secara lokal dan tidak pernah dikirim ke server manapun.
              </span>
            </div>
          </div>
        )}

        {/* INPUT MODE 2: PASTE ABSTRACT */}
        {activeInputMode === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase font-mono mb-1.5">
                Teks Abstrak Naskah
              </label>
              <textarea
                rows={7}
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="Tempelkan paragraf abstrak naskah LKTI di sini untuk memeriksa sidik jari teks..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans leading-relaxed"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {abstractText.length} karakter • {abstractText.trim() ? abstractText.trim().split(/\s+/).length : 0} kata
              </span>
              <button
                onClick={handleManualCheck}
                disabled={isProcessing || !abstractText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <span>Periksa Abstrak</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & Indicators during Processing */}
        {isProcessing && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 font-semibold">{progressMessage}</span>
              <span className="text-brand-primary font-bold">Langkah {progressStep}/3</span>
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
            onDownloadPdf={handleDownloadPdf}
            onViewExplorer={handleViewExplorer}
          />
        )}

      </div>

    </div>
  );
}
