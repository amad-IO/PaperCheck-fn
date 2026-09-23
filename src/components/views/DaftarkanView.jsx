'use client';

import React, { useState } from 'react';
import { Shield, User, FileText, UploadCloud, CheckCircle2, Lock, ArrowRight, ArrowLeft, Download, ExternalLink, Award } from 'lucide-react';
import { extractTextFromFile } from '../../lib/parser';
import { generateDocumentFingerprint } from '../../lib/hasher';
import { registerManuscriptLocal } from '../../lib/mockRegistry';

export default function DaftarkanView({ walletState, connectWallet, showToast, setActiveTab }) {
  // Stepper: 1 (Biodata), 2 (Karya), 3 (Naskah & Hash), 4 (Konfirmasi & Tanda Tangan), 5 (Sertifikat Sukses)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    authorName: '',
    institution: '',
    email: '',
    title: '',
    category: 'Teknologi Tepat Guna',
  });

  // Document State
  const [file, setFile] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  // Result / Certificate State
  const [registrationReceipt, setRegistrationReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Teknologi Tepat Guna',
    'Kesehatan & Biomedis',
    'Sosial Humaniora & Pendidikan',
    'Energi & Lingkungan',
    'Agrokompleks & Pangan',
    'Ekonomi Kreatif & Bisnis'
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
          throw new Error('Dokumen kosong atau tidak memiliki teks yang dapat dibaca.');
        }

        const fp = await generateDocumentFingerprint(text);
        setFingerprint(fp);
        showToast('Sidik Jari Terbuat', 'SHA-256 dan SimHash berhasil dihitung.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Gagal Menghitung Hash', err.message, 'error');
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
        showToast('Data Belum Lengkap', 'Harap isi nama ketua dan instansi/kampus.', 'warning');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.title.trim()) {
        showToast('Judul Wajib Diisi', 'Harap masukkan judul naskah karya ilmiah.', 'warning');
        return;
      }
    } else if (currentStep === 3) {
      if (!fingerprint) {
        showToast('Unggah Dokumen', 'Harap unggah naskah naskah untuk menghasilkan sidik jari.', 'warning');
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
      showToast('Koneksi Wallet Diperlukan', 'Harap hubungkan dompet kripto terlebih dahulu.', 'warning');
      connectWallet();
      return;
    }

    setIsSubmitting(true);
    showToast('Menyiapkan Transaksi', 'Menandatangani pencatatan sidik jari naskah ke Base Sepolia...', 'info');

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
      showToast('Pendaftaran Berhasil', 'Sidik jari naskah telah tercatat permanen di blockchain.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal Mendaftar', 'Transaksi gagal atau dibatalkan oleh pengguna.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-2 pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Daftarkan Naskah LKTI
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Kunci hak orisinalitas dan bukti waktu kepemilikan naskah secara permanen sebelum diajukan ke kompetisi.
        </p>
      </section>

      {/* Wallet Connection Gate */}
      {!walletState.isConnected && currentStep < 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-xs text-amber-900">
              <strong>Koneksi Diperlukan:</strong> Anda perlu menghubungkan wallet untuk menandatangani bukti waktu on-chain.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shrink-0 shadow-sm"
          >
            Hubungkan Wallet
          </button>
        </div>
      )}

      {/* Stepper Progress Indicator */}
      {currentStep <= 4 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Biodata' },
            { step: 2, title: 'Karya' },
            { step: 3, title: 'Sidik Jari' },
            { step: 4, title: 'Konfirmasi' }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`h-1.5 rounded-full mb-1.5 transition-all ${
                currentStep >= item.step ? 'bg-brand-primary' : 'bg-slate-200'
              }`}></div>
              <span className={`text-[11px] font-mono font-medium ${
                currentStep >= item.step ? 'text-brand-700' : 'text-slate-400'
              }`}>
                {item.step}. {item.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        
        {/* STEP 1: BIODATA PENULIS */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Biodata Penulis</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data ini hanya disimpan secara lokal/off-chain dan TIDAK akan pernah dipublikasikan ke blockchain.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ketua Tim / Penulis Utama *</label>
                <input
                  type="text"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleInputChange}
                  placeholder="Contoh: Muhammad Fikri Pratama"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asal Perguruan Tinggi / Instansi *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  placeholder="Contoh: Universitas Negeri Makassar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email Korespondensi (Opsional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Contoh: penulis@kampus.ac.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Lanjut: Data Karya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DATA KARYA */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Informasi Karya Ilmiah</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan informasi naskah LKTI yang akan didaftarkan.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Lengkap Naskah *</label>
                <textarea
                  rows={3}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul naskah secara lengkap..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori / Sub-Tema *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-brand-primary"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Lanjut: Upload Naskah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: UPLOAD NASKAH & FINGERPRINTING */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Pembuatan Sidik Jari Naskah</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Naskah diekstrak di browser untuk menghitung SHA-256 dan SimHash. Berkas tidak dikirim ke server.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                id="manuscript-file-input"
                className="hidden"
              />
              <label htmlFor="manuscript-file-input" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-10 h-10 text-brand-primary mx-auto" />
                <div className="text-xs font-semibold text-slate-800">
                  {file ? file.name : 'Pilih Berkas Naskah LKTI (PDF / DOCX)'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Maksimal 25 MB • Diproses lokal di browser
                </div>
              </label>
            </div>

            {isHashing && (
              <div className="p-4 bg-slate-50 rounded-xl text-xs font-mono text-center text-brand-700 animate-pulse">
                Sedang mengekstrak teks dan menghitung sidik jari...
              </div>
            )}

            {fingerprint && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-900 font-bold">
                  <span>Sidik Jari Selesai Dihitung:</span>
                  <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full">Siap Didaftarkan</span>
                </div>
                <div className="truncate text-slate-700">
                  <span className="text-emerald-700 font-semibold">SHA-256:</span> {fingerprint.sha256}
                </div>
                <div className="truncate text-slate-700">
                  <span className="text-emerald-700 font-semibold">SimHash 64-bit:</span> {fingerprint.simHash}
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
                  Panjang dokumen: {fingerprint.wordCount} kata ({fingerprint.charCount} karakter)
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!fingerprint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <span>Lanjut: Konfirmasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: KONFIRMASI ON-CHAIN TRANSPARENCY */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">4. Konfirmasi Pencatatan Permanen</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa data yang akan dicatatkan ke smart contract sebelum menandatangani transaksi.
              </p>
            </div>

            {/* Privacy Box: What is stored on-chain vs off-chain */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 font-mono uppercase">
                Transparansi Penyimpanan Data:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dicatat On-Chain:</span>
                  </div>
                  <ul className="list-disc list-inside text-emerald-800 text-[11px] space-y-0.5 font-mono">
                    <li>SHA-256 Hash</li>
                    <li>SimHash 64-bit</li>
                    <li>Timestamp blok</li>
                    <li>Alamat Wallet Penulis</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>TIDAK Masuk On-Chain:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>Isi naskah / teks lengkap</li>
                    <li>Nama ketua dan anggota tim</li>
                    <li>Alamat email</li>
                    <li>File asli PDF/DOCX</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Summary Review */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Judul Naskah:</span>
                <span className="font-bold text-slate-900 text-right max-w-[280px] truncate">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-medium text-slate-900">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penulis / Instansi:</span>
                <span className="font-medium text-slate-900">{formData.authorName} ({formData.institution})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Wallet Penandatangan:</span>
                <span className="font-medium text-brand-700">
                  {walletState.isConnected ? `${walletState.address.substring(0, 10)}...` : 'Belum terhubung'}
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
                <span>Kembali</span>
              </button>
              <button
                onClick={handleRegisterOnChain}
                disabled={isSubmitting || !walletState.isConnected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menandatangani Transaksi...</span>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Daftarkan Naskah On-Chain</span>
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
              <h2 className="text-2xl font-bold text-slate-900">Sertifikat Bukti Waktu Terbit</h2>
              <p className="text-xs text-slate-500 mt-1">
                Naskah ini telah tercatat secara permanen di blockchain Base Sepolia.
              </p>
            </div>

            {/* Certificate Box */}
            <div className="border-2 border-slate-200 bg-slate-50/70 rounded-2xl p-6 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">ID Registrasi:</span>
                <span className="font-bold text-slate-900">LKTI-{registrationReceipt.registeredAt}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px]">JUDUL KARYA:</span>
                <span className="font-bold text-slate-900 font-sans text-sm">{registrationReceipt.title}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px]">SHA-256 FINGERPRINT:</span>
                <span className="font-bold text-brand-primary text-[11px] break-all">{registrationReceipt.contentHash}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">SimHash:</span>
                <span className="font-bold text-slate-900">{registrationReceipt.simHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Tercatat:</span>
                <span className="text-slate-900">{new Date(registrationReceipt.registeredAt).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => showToast('Mengunduh Sertifikat', 'Sertifikat pendaftaran sedang diunduh.', 'info')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Sertifikat PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('cek')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                Kembali ke Halaman Cek
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
