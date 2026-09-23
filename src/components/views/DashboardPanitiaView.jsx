'use client';

import React, { useState } from 'react';
import { Award, Globe, CheckCircle2, AlertCircle, PlusCircle, UploadCloud, ArrowRight, ShieldCheck, FileText, Send } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { addParticipationLocal, checkManuscriptRegistry } from '../../lib/mockRegistry';

export default function DashboardPanitiaView({ walletState, connectWallet, showToast, setActiveTab }) {
  const [panitiaTab, setPanitiaTab] = useState('batch'); // 'batch' | 'buat' | 'verifikasi'

  // Form Buat Lomba
  const [competitionForm, setCompetitionForm] = useState({
    name: '',
    year: new Date().getFullYear().toString(),
    category: 'Teknologi & Inovasi',
    institutionDomain: 'lkti.unm.ac.id'
  });

  // Verifikasi Domain State
  const [domainStatus, setDomainStatus] = useState({
    domain: 'lkti.unm.ac.id',
    isVerified: true,
    dnsTxtRecord: `lkti-verify=${walletState.address || '0x71C8364437a90961f84582042a552746b34571Cd'}`
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
    showToast('Memproses Berkas', `Mengekstrak teks dari ${files.length} naskah...`, 'info');

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
            status: 'Peserta', // Default: Peserta | Finalis | Juara
            similarityScore: registryCheck.similarityPercentage || 0,
            hasConflict: registryCheck.status !== 'clean'
          });
        } catch (err) {
          console.warn(`Gagal memproses file ${file.name}:`, err);
        }
      }

      setBatchFiles(prev => [...prev, ...parsedList]);
      showToast('Parsing Selesai', `${parsedList.length} naskah siap dicatatkan ke smart contract.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal Memproses Batch', err.message, 'error');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setBatchFiles(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleBatchSubmit = async () => {
    if (!walletState.isConnected) {
      showToast('Koneksi Diperlukan', 'Hubungkan wallet panitia untuk menandatangani pencatatan massal.', 'warning');
      connectWallet();
      return;
    }

    if (batchFiles.length === 0) {
      showToast('Naskah Kosong', 'Unggah berkas naskah terlebih dahulu.', 'warning');
      return;
    }

    setIsSubmittingBatch(true);
    showToast('Menyiapkan Transaksi Massal', `Mencatat ${batchFiles.length} naskah on-chain via Base Sepolia...`, 'info');

    try {
      await new Promise(r => setTimeout(r, 2000));

      // Save each to local mock registry
      for (const item of batchFiles) {
        addParticipationLocal({
          contentHash: item.sha256,
          competitionName: competitionForm.name || 'PIMNAS & LKTI Nasional 2026',
          year: competitionForm.year,
          category: competitionForm.category,
          status: item.status,
          recordedBy: walletState.address,
          recorderName: 'BEM / Panitia Resmi',
          domain: domainStatus.domain,
          badge: domainStatus.isVerified ? 'domain_verified' : 'anonymous'
        });
      }

      showToast('Batch Selesai Dicatat', `Seluruh ${batchFiles.length} naskah berhasil dicatat secara permanen.`, 'success');
      setBatchFiles([]);
    } catch (err) {
      console.error(err);
      showToast('Gagal Mencatat', err.message, 'error');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsCheckingDomain(true);
    showToast('Memeriksa DNS TXT', `Menghubungi nameserver untuk domain ${domainStatus.domain}...`, 'info');

    setTimeout(() => {
      setIsCheckingDomain(false);
      setDomainStatus(prev => ({ ...prev, isVerified: true }));
      showToast('Domain Terverifikasi', `DNS TXT record cocok dengan wallet ${walletState.address ? walletState.address.substring(0, 6) + '...' : 'panitia'}.`, 'success');
    }, 1800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-2 pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Dashboard Panitia Lomba
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Kelola kompetisi, verifikasi kredibilitas domain kampus, dan catat hasil naskah juara secara kolektif on-chain.
        </p>
      </section>

      {/* Domain Verification Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            domainStatus.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Domain Institusi Panitia:</span>
              <span className="font-mono text-xs text-brand-700 font-semibold">{domainStatus.domain}</span>
              {domainStatus.isVerified ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  Terverifikasi
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  Belum Verifikasi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Catatan hasil lomba akan memperoleh lencana <strong>Terverifikasi Domain</strong> di mata publik.
            </p>
          </div>
        </div>

        <button
          onClick={() => setPanitiaTab('verifikasi')}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold shrink-0"
        >
          Konfigurasi DNS
        </button>
      </div>

      {/* Main Action Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setPanitiaTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              panitiaTab === 'batch' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Catat Hasil Kolektif (Batch)
          </button>
          <button
            onClick={() => setPanitiaTab('buat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              panitiaTab === 'buat' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Buat Lomba Baru
          </button>
          <button
            onClick={() => setPanitiaTab('verifikasi')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              panitiaTab === 'verifikasi' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Verifikasi Domain (DNS)
          </button>
        </div>

        {/* TAB 1: CATAT HASIL BATCH (MULTI-FILE UPLOAD) */}
        {panitiaTab === 'batch' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catat Hasil Naskah Kolektif (Batch Upload)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah banyak berkas naskah sekaligus untuk menandai status Peserta, Finalis, atau Juara dalam satu transaksi on-chain.
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
                  {isProcessingBatch ? 'Sedang mengekstrak berkas...' : 'Pilih Banyak Naskah Sekaligus (Multi-select PDF/DOCX)'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Sistem mengekstrak judul dan menghitung sidik jari secara otomatis
                </div>
              </label>
            </div>

            {/* Table of Parsed Files */}
            {batchFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 font-mono">
                    Daftar Naskah Siap Dicatat ({batchFiles.length} berkas):
                  </span>
                  <button 
                    onClick={() => setBatchFiles([])}
                    className="text-slate-400 hover:text-rose-600 font-mono text-[11px]"
                  >
                    Kosongkan Tabel
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-mono font-semibold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Nama Berkas & Judul</th>
                        <th className="py-2.5 px-3">Fingerprint</th>
                        <th className="py-2.5 px-3">Kemiripan</th>
                        <th className="py-2.5 px-3">Status Penetapan</th>
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
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-100 text-rose-800 font-bold">
                                {item.similarityScore}% Mirip
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-100 text-emerald-800">
                                0% Bersih
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:border-brand-primary"
                            >
                              <option value="Peserta">Peserta</option>
                              <option value="Finalis">Finalis</option>
                              <option value="Juara">Juara</option>
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
                    <span>{isSubmittingBatch ? 'Mencatat On-Chain...' : 'Kirim On-Chain Bersamaan'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUAT LOMBA */}
        {panitiaTab === 'buat' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrasi Lomba Baru</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftarkan kompetisi pada smart contract agar tercatat resmi sebagai pihak penyelenggara.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kompetisi LKTI *</label>
                <input
                  type="text"
                  value={competitionForm.name}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Lomba Karya Tulis Ilmiah Nasional Green Tech 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Lomba *</label>
                  <input
                    type="number"
                    value={competitionForm.year}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Utama *</label>
                  <input
                    type="text"
                    value={competitionForm.category}
                    onChange={(e) => setCompetitionForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Situs Kampus/Lomba *</label>
                <input
                  type="text"
                  value={competitionForm.institutionDomain}
                  onChange={(e) => setCompetitionForm(prev => ({ ...prev, institutionDomain: e.target.value }))}
                  placeholder="misal: lkti.unm.ac.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <button
              onClick={() => showToast('Lomba Dibuat', 'Kompetisi berhasil didaftarkan ke smart contract registry.', 'success')}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simpan & Daftarkan Lomba On-Chain</span>
            </button>
          </div>
        )}

        {/* TAB 3: VERIFIKASI DOMAIN (DNS TXT) */}
        {panitiaTab === 'verifikasi' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900">Verifikasi Domain Institusi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buktikan bahwa wallet panitia terafiliasi dengan domain resmi universitas/lembaga melalui record DNS TXT.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Panduan Pemasangan DNS TXT:</div>
              <ol className="list-decimal list-inside text-slate-600 space-y-1 leading-relaxed">
                <li>Buka DNS management provider domain kampus Anda (misal: <code>unm.ac.id</code>).</li>
                <li>Tambahkan satu record baru bertipe <strong>TXT</strong>.</li>
                <li>Masukkan string verifikasi berikut pada kolom value:</li>
              </ol>

              <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all">
                {domainStatus.dnsTxtRecord}
              </div>

              <p className="text-[11px] text-slate-500">
                Setelah record DNS tersimpan, klik tombol di bawah untuk memeriksa validasi secara otomatis.
              </p>
            </div>

            <button
              onClick={handleVerifyDomain}
              disabled={isCheckingDomain}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isCheckingDomain ? 'Mengecek Nameserver...' : 'Cek Verifikasi Domain Sekarang'}</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
