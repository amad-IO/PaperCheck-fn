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
import { Shield, CheckCircle, AlertCircle, Info, X, FileText, UploadCloud, Search, Award, Play, Pause } from 'lucide-react';

const TAB_ORDER = {
  'cek': 0,
  'daftarkan': 1,
  'panitia': 2,
  'detail': 3
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('cek'); // 'cek' | 'daftarkan' | 'panitia' | 'detail'
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'
  
  // Wallet State
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: '',
    chainId: 84532 // Base Sepolia
  });

  // 3D Carousel Rotation State (2-second auto-rotation)
  const [centerIndex, setCenterIndex] = useState(2); // Card 2 (Vosging) starts at center
  const [isPaused, setIsPaused] = useState(false);

  // Showcase Center Card Interactive State
  const [showcaseInput, setShowcaseInput] = useState('');
  const [showcaseHash, setShowcaseHash] = useState(null);
  const [showcaseStatus, setShowcaseStatus] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
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
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const id = Date.now();
    setToast({ id, title, message, type });
    toastTimeoutRef.current = setTimeout(() => {
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
          showToast('Wallet Connected', `Connected to ${accounts[0].substring(0, 6)}...`, 'success');
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
    showToast('Demo Wallet Active', `Connected to ${demoAddress.substring(0, 6)}...`, 'success');
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: '',
      chainId: 84532
    });
    showToast('Wallet Disconnected', 'Wallet connection terminated.', 'info');
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const prevIndex = TAB_ORDER[activeTab] ?? 0;
    const nextIndex = TAB_ORDER[newTab] ?? 0;
    setSlideDirection(nextIndex >= prevIndex ? 'forward' : 'backward');
    setActiveTab(newTab);
  };

  const scrollToWorkspace = (tab) => {
    if (tab !== activeTab) {
      handleTabChange(tab);
    }
    const performScroll = () => {
      if (workspaceRef.current) {
        const navbarHeight = 64; // Sticky navbar height (h-16)
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        const elementTop = workspaceRef.current.getBoundingClientRect().top + currentScroll;
        window.scrollTo({
          top: Math.max(0, elementTop - navbarHeight),
          behavior: 'smooth'
        });
      }
    };

    performScroll();
    requestAnimationFrame(performScroll);
  };

  const handleShowcasePreset = async (presetKey) => {
    const text = SAMPLE_ABSTRACTS[presetKey];
    setShowcaseInput(text);
    try {
      const fp = await generateDocumentFingerprint(text);
      setShowcaseHash(fp);
      const res = await checkManuscriptRegistry(text);
      setShowcaseStatus(res);
      showToast('Preview Updated', `Fingerprint: ${fp.sha256.substring(0, 14)}...`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Predefined slot styles for the 5-card fanned carousel
  // All cards have exact identical dimensions: w-[270px] sm:w-[290px] h-[340px] rounded-[26px]
  const getSlotClass = (cardIndex) => {
    const slot = (cardIndex - centerIndex + 2 + 5) % 5;
    
    switch (slot) {
      case 0: // Slot 0: Far Left
        return 'transform -translate-x-[55px] sm:-translate-x-[210px] md:-translate-x-[280px] translate-y-2 -rotate-[8deg] scale-[0.92] z-0 opacity-80 sm:opacity-90';
      case 1: // Slot 1: Mid Left
        return 'transform -translate-x-[28px] sm:-translate-x-[105px] md:-translate-x-[140px] translate-y-1 -rotate-[4deg] scale-[0.96] z-10 opacity-90 sm:opacity-95';
      case 2: // Slot 2: Center Front Primary
        return 'transform translate-x-0 translate-y-0 rotate-0 scale-100 z-20 opacity-100 shadow-2xl';
      case 3: // Slot 3: Mid Right
        return 'transform translate-x-[28px] sm:translate-x-[105px] md:translate-x-[140px] translate-y-1 rotate-[4deg] scale-[0.96] z-10 opacity-90 sm:opacity-95';
      case 4: // Slot 4: Far Right
        return 'transform translate-x-[55px] sm:translate-x-[210px] md:translate-x-[280px] translate-y-2 rotate-[8deg] scale-[0.92] z-0 opacity-80 sm:opacity-90';
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
      <section className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-5 px-4 sm:px-6 select-none overflow-hidden">
        
        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-5">
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-medium text-slate-900 dark:text-white tracking-tight leading-[1.08] mb-2.5">
            System Metriqs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
            Real-time mapping of data streams and architectural consolidation. Designed for absolute clarity.
          </p>

          {/* Preset Buttons & Rotation Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">Quick Demo:</span>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_CLEAN')}
              className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white dark:bg-[#262626] dark:hover:bg-[#2e2e2e] border border-slate-300 dark:border-[#383838] text-emerald-800 dark:text-emerald-400 text-xs font-medium shadow-sm transition-all"
            >
              Clean Paper
            </button>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_A')}
              className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white dark:bg-[#262626] dark:hover:bg-[#2e2e2e] border border-slate-300 dark:border-[#383838] text-[#ED7B46] dark:text-[#F5A87B] text-xs font-medium shadow-sm transition-all"
            >
              Prior Award Winner
            </button>
            <button 
              onClick={() => handleShowcasePreset('SAMPLE_A_PARAPHRASED')}
              className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white dark:bg-[#262626] dark:hover:bg-[#2e2e2e] border border-slate-300 dark:border-[#383838] text-rose-800 dark:text-rose-400 text-xs font-medium shadow-sm transition-all"
            >
              Paraphrased Match
            </button>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#262626] dark:hover:bg-[#2e2e2e] border border-slate-300 dark:border-[#383838] text-slate-700 dark:text-slate-300 text-xs font-mono font-medium shadow-sm transition-all flex items-center gap-1"
            >
              {isPaused ? 'Resume Rotation' : 'Pause (2s)'}
            </button>
          </div>
        </div>

        {/* FANNED STACKED CARDS CONTAINER
            Every card has uniform compact dimensions: w-[270px] sm:w-[290px] h-[340px] rounded-[26px]
            Cycles automatically every 2 seconds with 700ms smooth transitions */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative w-full max-w-[980px] h-[360px] flex items-center justify-center cursor-pointer"
        >
          
          {/* CARD 0: Fodlecte (Peach #F5A87B) */}
          <div 
            onClick={() => setCenterIndex(0)}
            className={`absolute w-[270px] sm:w-[290px] h-[340px] rounded-[26px] bg-[#F5A87B] p-5 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(0)}`}
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1.5">Fodlecte</h3>
              <p className="text-white/85 text-xs leading-relaxed mb-3 line-clamp-2 font-normal">
                Lome pastro allios saide oncesic omd cosfotidtila cert irot niridve const oormot.
              </p>
              
              <div className="space-y-2">
                <div className="bg-white/15 rounded-xl p-2.5">
                  <div className="text-[10px] text-white/75 font-mono">Total Hash</div>
                  <div className="text-lg font-bold font-mono">1,245</div>
                </div>
                <div className="bg-white/15 rounded-xl p-2.5">
                  <div className="text-[10px] text-white/75 font-mono">Global Events</div>
                  <div className="text-base font-bold font-mono">15</div>
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
            className={`absolute w-[270px] sm:w-[290px] h-[340px] rounded-[26px] bg-[#E06336] p-5 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(1)}`}
          >
            <div>
              <h3 className="text-xl font-bold mb-1.5">Heschin</h3>
              <p className="text-white/85 text-xs leading-relaxed mb-3 line-clamp-2 font-normal">
                Lome stupur olligrmu crloldlt oniomsnin d...
              </p>
              
              {/* Equalizer Bar Chart */}
              <div className="flex items-end justify-between h-16 px-3 py-2 bg-black/10 rounded-xl mb-3">
                <div className="w-2.5 bg-white/95 rounded-full h-[45%]"></div>
                <div className="w-2.5 bg-white/95 rounded-full h-[75%]"></div>
                <div className="w-2.5 bg-white/95 rounded-full h-[100%]"></div>
                <div className="w-2.5 bg-white/95 rounded-full h-[60%]"></div>
                <div className="w-2.5 bg-white/95 rounded-full h-[85%]"></div>
                <div className="w-2.5 bg-white/95 rounded-full h-[40%]"></div>
              </div>

              {/* Hoohens & Gonets Buttons */}
              <div className="space-y-1.5">
                <div className="w-full py-2 px-3 rounded-full bg-white/15 text-center text-xs font-semibold">
                  Hoohens
                </div>
                <div className="w-full py-2 px-3 rounded-full bg-white/10 text-center text-xs font-semibold text-white/85">
                  Gonets
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-white/60 text-center">• • •</div>
          </div>

          {/* CARD 2: Vosging (Center Frosted Glass Acrylic) */}
          <div 
            onClick={() => setCenterIndex(2)}
            className={`absolute w-[270px] sm:w-[290px] h-[340px] rounded-[26px] acrylic-card p-5 shadow-2xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(2)}`}
          >
            <div>
              {/* Top Icons Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/85 border border-white/90 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-slate-800" />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowcaseInput('');
                    setShowcaseHash(null);
                    setShowcaseStatus(null);
                  }}
                  title="Reset preview"
                  className="w-6 h-6 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-slate-500 transition-all shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Copy from reference */}
              <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Vosging</h2>
                <p className="text-slate-600 text-[11px] leading-tight mt-0.5 font-normal line-clamp-1">
                  Lame stywa otters oxisrcio oscaoooshair ceed ooisnp.
                </p>
              </div>

              {/* Inner Acrylic Box with OS & Spline Wave Graph */}
              <div className="inner-acrylic rounded-2xl p-2.5 shadow-sm mb-2 relative overflow-hidden">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider font-mono">OS</span>
                  <div className="w-4 h-4 rounded bg-white/80 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>

                {/* Interactive Demo File Shortcut */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToWorkspace('cek');
                  }}
                  className="cursor-pointer bg-white/90 border border-slate-300/80 rounded-lg py-1 px-2 text-[10px] font-mono text-slate-700 truncate shadow-inner flex items-center justify-between my-1 hover:border-[#ED7B46]"
                >
                  <span className="truncate">
                    {showcaseInput ? showcaseInput.substring(0, 20) + '...' : 'Select Manuscript...'}
                  </span>
                  <UploadCloud className="w-3 h-3 text-[#ED7B46] shrink-0 ml-1" />
                </div>

                {/* SVG Spline Wave Curve */}
                <div className="relative h-8 w-full flex items-center justify-center">
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 60" fill="none" preserveAspectRatio="none">
                    <path className="spline-path" d="M0,35 Q40,48 80,30 T160,20 T240,45 T300,25" stroke="#ED7B46" strokeWidth="2.5" fill="none" />
                    <circle cx="80" cy="30" r="3.5" fill="#FFFFFF" stroke="#ED7B46" strokeWidth="2" />
                    <circle cx="160" cy="20" r="3.5" fill="#FFFFFF" stroke="#ED7B46" strokeWidth="2" />
                    <circle cx="240" cy="45" r="3.5" fill="#FFFFFF" stroke="#ED7B46" strokeWidth="2" />
                  </svg>
                </div>

                {/* Live Hash / Status Footer */}
                <div className="mt-0.5 pt-0.5 border-t border-slate-200/60 flex items-center justify-between text-[8px] font-mono">
                  <span className="text-slate-500 truncate max-w-[120px]">
                    {showcaseHash ? `${showcaseHash.sha256.substring(0, 12)}...` : 'Awaiting document...'}
                  </span>
                  {showcaseStatus && (
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      showcaseStatus.status === 'clean' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : showcaseStatus.status === 'participated'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {showcaseStatus.status === 'clean' ? 'Clean' : (showcaseStatus.status === 'participated' ? 'Prior' : 'Match')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Pill Buttons: Adelhorn & Motrew */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToWorkspace('cek');
                }}
                className="w-full py-2 px-3 rounded-full bg-white/80 hover:bg-white text-slate-800 text-[11px] font-semibold shadow-sm border border-white/90 transition-all text-center"
              >
                Adelhorn
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToWorkspace('daftarkan');
                }}
                className="w-full py-2 px-3 rounded-full bg-[#ED7B46] hover:bg-[#E06336] text-white text-[11px] font-semibold shadow-md transition-all text-center"
              >
                Motrew
              </button>
            </div>
          </div>

          {/* CARD 3: ertads (Slate Navy #3D4A60) */}
          <div 
            onClick={() => setCenterIndex(3)}
            className={`absolute w-[270px] sm:w-[290px] h-[340px] rounded-[26px] bg-[#3D4A60] p-5 text-white shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(3)}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/60">INTEGRITY</span>
                <span className="text-xs text-white/60">• •</span>
              </div>
              <h3 className="text-xl font-bold mb-1">ertads</h3>
              <p className="text-white/70 text-xs leading-relaxed mb-3 line-clamp-2 font-normal">
                Decentralized validation matrix for hackathon integrity assurance.
              </p>

              <div className="bg-black/20 rounded-xl p-3 space-y-2 mb-3">
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

              <div className="py-2 px-3 rounded-full bg-white/10 text-center text-xs font-semibold">
                New
              </div>
            </div>
            <div className="text-[10px] font-mono text-white/50 text-right">0x968...BOT</div>
          </div>

          {/* CARD 4: Registry (Ice Blue #DCE5EC) */}
          <div 
            onClick={() => setCenterIndex(4)}
            className={`absolute w-[270px] sm:w-[290px] h-[340px] rounded-[26px] bg-[#DCE5EC] p-5 text-[#2D3748] shadow-xl flex flex-col justify-between transition-all duration-700 ease-in-out ${getSlotClass(4)}`}
          >
            <div>
              <div className="flex items-center justify-end mb-2">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1 text-slate-800">Registry</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-3 line-clamp-2 font-normal">
                Immutable cryptographic fingerprints on BOT Chain ledger.
              </p>
              
              <div className="space-y-1.5">
                <div className="p-2.5 bg-white/80 rounded-xl text-xs font-mono shadow-sm">
                  <div className="text-slate-400 text-[9px]">LAST HASH</div>
                  <div className="font-bold truncate text-slate-800">0x6b86b...5b4b</div>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl text-xs font-mono shadow-sm">
                  <div className="text-slate-400 text-[9px]">STATUS</div>
                  <div className="font-bold text-emerald-600">Finalized</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
              aria-label={`Select Card ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                centerIndex === idx ? 'w-6 bg-[#ED7B46]' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

      </section>

      {/* WORKSPACE SECTION */}
      <section ref={workspaceRef} className="scroll-mt-16 w-full min-h-[calc(100vh-4rem)] bg-white dark:bg-[#1E1E1E] border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8 shadow-inner overflow-hidden transition-colors duration-200">
        <div className="max-w-5xl mx-auto overflow-hidden">
          
          {/* ACTIVE WORKSPACE VIEW WITH DIRECTIONAL ANIMATION */}
          <div 
            key={activeTab} 
            className={`w-full ${slideDirection === 'forward' ? 'page-slide-forward' : 'page-slide-backward'}`}
          >
            {activeTab === 'cek' && (
              <CekNaskahView showToast={showToast} />
            )}

            {activeTab === 'daftarkan' && (
              <DaftarkanView 
                walletState={walletState} 
                connectWallet={connectWallet}
                showToast={showToast}
                setActiveTab={scrollToWorkspace}
              />
            )}

            {activeTab === 'panitia' && (
              <DashboardPanitiaView 
                walletState={walletState} 
                connectWallet={connectWallet}
                showToast={showToast}
                setActiveTab={scrollToWorkspace}
              />
            )}

            {activeTab === 'detail' && (
              <DetailNaskahView 
                walletState={walletState} 
                showToast={showToast}
              />
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E1E1E] py-6 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="PaperCheck" className="w-4 h-4 object-contain" />
            <span>PaperCheck Protocol • Decentralized Academic Manuscript Integrity</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Base Sepolia L2</span>
            <span>•</span>
            <span>Client-Side Privacy</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification (Minimalist Sonner/Linear Style) */}
      {toast && (
        <div 
          key={toast.id || toast.title}
          className="fixed bottom-6 right-6 z-50 flex items-start gap-3 w-auto max-w-sm sm:max-w-md bg-white/95 dark:bg-[#262626]/95 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-slate-200/90 dark:border-[#383838] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(0,0,0,0.3)] toast-animate-in select-none"
        >
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#ED7B46]" />}
          </div>

          {/* Typography */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-normal">
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 transition-colors p-0.5 -mr-1 -mt-0.5 shrink-0"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
