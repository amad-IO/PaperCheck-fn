'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import CekNaskahView from '../components/views/CekNaskahView';
import DaftarkanView from '../components/views/DaftarkanView';
import DashboardPanitiaView from '../components/views/DashboardPanitiaView';
import DetailNaskahView from '../components/views/DetailNaskahView';
import { extractTextFromFile } from '../lib/parser';
import { generateDocumentFingerprint } from '../lib/hasher';
import { checkManuscriptRegistry, SAMPLE_ABSTRACTS, registerManuscriptLocal } from '../lib/mockRegistry';
import { Shield, CheckCircle, AlertCircle, Info, X, FileText, UploadCloud, Search, Award, FileCheck, Layers, Play, Pause } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('cek'); // 'cek' | 'daftarkan' | 'panitia' | 'detail'
  
  // Wallet State
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: '',
    chainId: 84532 // Base Sepolia
  });

  // 3D Carousel Rotation State (Option A: 2-second auto-rotation)
  const [centerIndex, setCenterIndex] = useState(2); // Card 2 (Vosging) starts at center
  const [isPaused, setIsPaused] = useState(false);

  // Showcase Center Card Dummy/Interactive State
  const [showcaseInput, setShowcaseInput] = useState('');
  const [showcaseHash, setShowcaseHash] = useState(null);
  const [showcaseStatus, setShowcaseStatus] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const workspaceRef = useRef(null);

  // Auto-play timer: 2000ms (2 seconds)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const showToast = (title, message, type = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: 84532
          });
          showToast('Wallet Terhubung', `Terhubung ke ${accounts[0].substring(0, 6)}...`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Metamask request error:', e);
      }
    }

    const demoAddress = '0x71C8364437a90961f84582042a552746b34571Cd';
    setWalletState({
      isConnected: true,
      address: demoAddress,
      chainId: 84532
    });
    showToast('Wallet Simulasi Aktif', `Terhubung ke ${demoAddress.substring(0, 6)}...`, 'success');
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: '',
      chainId: 84532
    });
    showToast('Wallet Diputus', 'Koneksi wallet telah dihentikan.', 'info');
  };

  const scrollToWorkspace = (tab) => {
    setActiveTab(tab);
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowcasePreset = async (presetKey) => {
    const text = SAMPLE_ABSTRACTS[presetKey];
    setShowcaseInput(text);
    try {
      const fp = await generateDocumentFingerprint(text);
      setShowcaseHash(fp);
      const res = await checkManuscriptRegistry(text);
      setShowcaseStatus(res);
      showToast('Pratinjau Diperbarui', `Sidik jari: ${fp.sha256.substring(0, 14)}...`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Predefined slot styles for the 5-card fanned carousel
  // All cards have exact identical dimensions: w-[280px] sm:w-[300px] h-[460px] rounded-[30px]
  const getSlotClass = (cardIndex) => {
    const slot = (cardIndex - centerIndex + 2 + 5) % 5;
    
    switch (slot) {
      case 0: // Slot 0: Kiri Luar
        return 'transform -translate-x-[70px] sm:-translate-x-[260px] md:-translate-x-[340px] translate-y-3 -rotate-[10deg] scale-[0.91] z-0 opacity-80 sm:opacity-90';
      case 1: // Slot 1: Kiri Tengah
        return 'transform -translate-x-[35px] sm:-translate-x-[130px] md:-translate-x-[170px] translate-y-1.5 -rotate-[5deg] scale-[0.96] z-10 opacity-90 sm:opacity-95';
      case 2: // Slot 2: Pusat Depan Utama
        return 'transform translate-x-0 translate-y-0 rotate-0 scale-100 z-20 opacity-100 shadow-2xl';
      case 3: // Slot 3: Kanan Tengah
        return 'transform translate-x-[35px] sm:translate-x-[130px] md:translate-x-[170px] translate-y-1.5 rotate-[5deg] scale-[0.96] z-10 opacity-90 sm:opacity-95';
      case 4: // Slot 4: Kanan Luar
        return 'transform translate-x-[70px] sm:translate-x-[260px] md:translate-x-[340px] translate-y-3 rotate-[10deg] scale-[0.91] z-0 opacity-80 sm:opacity-90';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      
      {/* Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => scrollToWorkspace(tab)}
        walletState={walletState}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      {/* Hero & Fanned Stacked Cards Showcase (Auto-Rotating every 2s, identical card sizes) */}
      <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col items-center select-none overflow-hidden">
        
        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-slate-900 tracking-tight leading-[1.08] mb-3">
            System Metriqs
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
            Real-time mapping of data streams and architectural consolidation. Designed for absolute clarity.
          </p>

          {/* Preset Buttons & Rotation Indicator */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Uji Cepat:</span>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_CLEAN')}
              className="px-3 py-1 rounded-full bg-white/90 hover:bg-white border border-slate-300 text-emerald-800 text-xs font-medium shadow-sm transition-all"
            >
              Naskah Bersih
            </button>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_A')}
              className="px-3 py-1 rounded-full bg-white/90 hover:bg-white border border-slate-300 text-[#ED7B46] text-xs font-medium shadow-sm transition-all"
            >
              Naskah Pernah Ikut
            </button>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_A_PARAPHRASED')}
              className="px-3 py-1 rounded-full bg-white/90 hover:bg-white border border-slate-300 text-rose-800 text-xs font-medium shadow-sm transition-all"
            >
              Naskah Parafrase
            </button>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-medium shadow-sm transition-all flex items-center gap-1"
            >
              {isPaused ? 'Lanjut Rotasi' : 'Jeda (2s)'}
            </button>
          </div>
        </div>

        {/* FANNED STACKED CARDS CONTAINER
            Setiap kartu memiliki ukuran seragam: w-[280px] sm:w-[300px] h-[460px] rounded-[30px]
            Berputar bergantian otomatis setiap 2 detik dengan transisi mulus 700ms */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative w-full max-w-[1020px] h-[500px] flex items-center justify-center cursor-pointer"
        >
          
          {/* CARD 0: Fodlecte (Peach #F5A87B) */}
          <div 
            onClick={() => setCenterIndex(0)}
            className={`absolute w-[280px] sm:w-[300px] h-[460px] rounded-[30px] bg-[#F5A87B] p-6 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(0)}`}
          >
            <div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-6">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Fodlecte</h3>
              <p className="text-white/85 text-xs leading-relaxed mb-6 font-normal">
                Lome pastro allios saide oncesic omd cosfotidtila cert irot niridve const oormot.
              </p>
              
              <div className="space-y-3">
                <div className="bg-white/15 rounded-2xl p-3.5">
                  <div className="text-[10px] text-white/75 font-mono">Total Hash</div>
                  <div className="text-2xl font-bold font-mono">1,245</div>
                </div>
                <div className="bg-white/15 rounded-2xl p-3.5">
                  <div className="text-[10px] text-white/75 font-mono">Global Events</div>
                  <div className="text-xl font-bold font-mono">15</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="text-[10px] font-mono">LIVE FEED</span>
            </div>
          </div>

          {/* CARD 1: Heschin (Terracotta #E06336) */}
          <div 
            onClick={() => setCenterIndex(1)}
            className={`absolute w-[280px] sm:w-[300px] h-[460px] rounded-[30px] bg-[#E06336] p-6 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(1)}`}
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">Heschin</h3>
              <p className="text-white/85 text-xs leading-relaxed mb-5 font-normal">
                Lome stupur olligrmu crloldlt oniomsnin d...
              </p>
              
              {/* Equalizer Bar Chart */}
              <div className="flex items-end justify-between h-24 px-3 py-3 bg-black/10 rounded-2xl mb-6">
                <div className="w-3 bg-white/95 rounded-full h-[45%]"></div>
                <div className="w-3 bg-white/95 rounded-full h-[75%]"></div>
                <div className="w-3 bg-white/95 rounded-full h-[100%]"></div>
                <div className="w-3 bg-white/95 rounded-full h-[60%]"></div>
                <div className="w-3 bg-white/95 rounded-full h-[85%]"></div>
                <div className="w-3 bg-white/95 rounded-full h-[40%]"></div>
              </div>

              {/* Hoohens & Gonets Buttons */}
              <div className="space-y-2">
                <div className="w-full py-2.5 px-3 rounded-full bg-white/15 text-center text-xs font-semibold">
                  Hoohens
                </div>
                <div className="w-full py-2.5 px-3 rounded-full bg-white/10 text-center text-xs font-semibold text-white/85">
                  Gonets
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-white/60 text-center">• • •</div>
          </div>

          {/* CARD 2: Vosging (Center Frosted Glass Acrylic) */}
          <div 
            onClick={() => setCenterIndex(2)}
            className={`absolute w-[280px] sm:w-[300px] h-[460px] rounded-[30px] acrylic-card p-6 shadow-2xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(2)}`}
          >
            <div>
              {/* Top Icons Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-2xl bg-white/85 border border-white/90 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-slate-800" />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowcaseInput('');
                    setShowcaseHash(null);
                    setShowcaseStatus(null);
                  }}
                  title="Reset pratinjau"
                  className="w-7 h-7 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-slate-500 transition-all shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Copy from screenshot */}
              <div className="mb-3">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vosging</h2>
                <p className="text-slate-600 text-[11px] leading-relaxed mt-1 font-normal line-clamp-2">
                  Lame stywa otters oxisrcio oscaoooshair ceed ooisnp aidtie aaid ononrbitoifne oond enninos.
                </p>
              </div>

              {/* Inner Acrylic Box with OS & Spline Wave Graph */}
              <div className="inner-acrylic rounded-[20px] p-3.5 shadow-sm mb-3 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">OS</span>
                  <div className="w-5 h-5 rounded-md bg-white/80 flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>

                {/* Dummy/Shortcut Bar */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToWorkspace('cek');
                  }}
                  className="cursor-pointer bg-white/90 border border-slate-300/80 rounded-xl py-1.5 px-2.5 text-[10px] font-mono text-slate-700 truncate shadow-inner flex items-center justify-between my-1.5 hover:border-[#ED7B46]"
                >
                  <span className="truncate">
                    {showcaseInput ? showcaseInput.substring(0, 24) + '...' : 'Pilih Berkas Naskah LKTI (PDF / DOCX)...'}
                  </span>
                  <UploadCloud className="w-3 h-3 text-[#ED7B46] shrink-0 ml-1" />
                </div>

                {/* SVG Spline Wave Curve */}
                <div className="relative h-12 w-full flex items-center justify-center">
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 60" fill="none" preserveAspectRatio="none">
                    <path className="spline-path" d="M0,35 Q40,48 80,30 T160,20 T240,45 T300,25" stroke="#ED7B46" stroke-width="2.5" fill="none" />
                    <circle cx="80" cy="30" r="4" fill="#FFFFFF" stroke="#ED7B46" stroke-width="2" />
                    <circle cx="160" cy="20" r="4" fill="#FFFFFF" stroke="#ED7B46" stroke-width="2" />
                    <circle cx="240" cy="45" r="4" fill="#FFFFFF" stroke="#ED7B46" stroke-width="2" />
                  </svg>
                </div>

                {/* Live Hash / Status Footer */}
                <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-500 truncate max-w-[140px]">
                    {showcaseHash ? `${showcaseHash.sha256.substring(0, 14)}...` : 'Awaiting document...'}
                  </span>
                  {showcaseStatus && (
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      showcaseStatus.status === 'clean' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : showcaseStatus.status === 'participated'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {showcaseStatus.status === 'clean' ? 'Bersih' : (showcaseStatus.status === 'participated' ? 'Pernah Ikut' : 'Mirip')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Pill Buttons: Adelhorn & Motrew */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToWorkspace('cek');
                }}
                className="w-full py-2.5 px-3 rounded-full bg-white/80 hover:bg-white text-slate-800 text-[11px] font-semibold shadow-sm border border-white/90 transition-all text-center"
              >
                Adelhorn
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToWorkspace('daftarkan');
                }}
                className="w-full py-2.5 px-3 rounded-full bg-[#ED7B46] hover:bg-[#E06336] text-white text-[11px] font-semibold shadow-md transition-all text-center"
              >
                Motrew
              </button>
            </div>
          </div>

          {/* CARD 3: ertads (Slate Navy #3D4A60) */}
          <div 
            onClick={() => setCenterIndex(3)}
            className={`absolute w-[280px] sm:w-[300px] h-[460px] rounded-[30px] bg-[#3D4A60] p-6 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(3)}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-white/60">INTEGRITY</span>
                <span className="text-xs text-white/60">• •</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">ertads</h3>
              <p className="text-white/70 text-xs leading-relaxed mb-6 font-normal">
                Decentralized validation matrix for hackathon integrity assurance.
              </p>

              <div className="bg-black/20 rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70">Revert Prevention</span>
                  <span className="font-mono font-bold text-emerald-400">28%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70">Gas Efficiency</span>
                  <span className="font-mono font-bold text-white">20%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#ED7B46] h-full rounded-full w-[65%]"></div>
                </div>
              </div>

              <div className="py-2.5 px-4 rounded-full bg-white/10 text-center text-xs font-semibold">
                New
              </div>
            </div>
            <div className="text-[10px] font-mono text-white/50 text-right">0x968...BOT</div>
          </div>

          {/* CARD 4: Registry (Ice Blue #DCE5EC) */}
          <div 
            onClick={() => setCenterIndex(4)}
            className={`absolute w-[280px] sm:w-[300px] h-[460px] rounded-[30px] bg-[#DCE5EC] p-6 text-[#2D3748] shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(4)}`}
          >
            <div>
              <div className="flex items-center justify-end mb-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800">Registry</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-6 font-normal">
                Immutable cryptographic fingerprints on BOT Chain ledger.
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-white/80 rounded-2xl text-[11px] font-mono shadow-sm">
                  <div className="text-slate-400 text-[9px]">LAST HASH</div>
                  <div className="font-bold truncate text-slate-800">0x6b86b...5b4b</div>
                </div>
                <div className="p-3 bg-white/80 rounded-2xl text-[11px] font-mono shadow-sm">
                  <div className="text-slate-400 text-[9px]">STATUS</div>
                  <div className="font-bold text-emerald-600">Finalized</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] font-mono">JURY #01</span>
            </div>
          </div>

        </div>

        {/* 5 Interactive Rotation Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              onClick={() => setCenterIndex(idx)}
              aria-label={`Pilih Kartu ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                centerIndex === idx ? 'w-6 bg-[#ED7B46]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

      </section>

      {/* WORKSPACE SECTION (Field & Fitur Asli di Bawah) */}
      <section ref={workspaceRef} className="w-full bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-5xl mx-auto">
          
          {/* Workspace Tabs Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#ED7B46]" />
                <h2 className="text-xl font-bold text-slate-900">Area Kerja Registry LKTI</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan modul di bawah ini untuk memproses verifikasi berkas, mendaftarkan naskah, atau mengelola kompetisi.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-stretch sm:self-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('cek')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'cek' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-[#ED7B46]" />
                <span>1. Cek Naskah</span>
              </button>
              <button
                onClick={() => setActiveTab('daftarkan')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'daftarkan' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#ED7B46]" />
                <span>2. Daftarkan Naskah</span>
              </button>
              <button
                onClick={() => setActiveTab('panitia')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'panitia' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#ED7B46]" />
                <span>3. Dashboard Panitia</span>
              </button>
              <button
                onClick={() => setActiveTab('detail')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'detail' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#ED7B46]" />
                <span>4. Detail & Linimasa</span>
              </button>
            </div>
          </div>

          {/* ACTIVE WORKSPACE VIEW */}
          {activeTab === 'cek' && (
            <CekNaskahView showToast={showToast} />
          )}

          {activeTab === 'daftarkan' && (
            <DaftarkanView 
              walletState={walletState} 
              connectWallet={connectWallet}
              showToast={showToast}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'panitia' && (
            <DashboardPanitiaView 
              walletState={walletState}
              connectWallet={connectWallet}
              showToast={showToast}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'detail' && (
            <DetailNaskahView 
              walletState={walletState}
              showToast={showToast}
            />
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#ED7B46]" />
            <span>LKTI Registry Protocol • Standar Integritas Karya Ilmiah Mahasiswa</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Base Sepolia L2</span>
            <span>•</span>
            <span>Privasi Client-Side</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 acrylic-card border border-white/90 rounded-2xl p-4 shadow-xl flex items-start gap-3 max-w-md animate-in slide-in-from-bottom-4 duration-200">
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#ED7B46]" />}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-bold text-xs text-slate-900">{toast.title}</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
