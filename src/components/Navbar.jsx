'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Menu, X } from 'lucide-react';
import { getNetworkName } from '../lib/contract';

export default function Navbar({ activeTab, setActiveTab, walletState, connectWallet, disconnectWallet }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    ready: false,
    animating: false,
  });
  const tabRefs = useRef({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { id: 'cek', label: 'Check Paper' },
    { id: 'daftarkan', label: 'Register Paper' },
    { id: 'panitia', label: 'Committee Dashboard' },
    { id: 'detail', label: 'Paper Details' },
  ];

  useEffect(() => {
    // Clean up any remaining dark mode class or keys
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('theme');
      localStorage.removeItem('papercheck_theme');
    }
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (activeEl) {
        setIndicatorStyle((prev) => ({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          ready: true,
          animating: prev.ready,
        }));
      }
    };

    updateIndicator();
    const rAf = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(rAf);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#ED7B46]/20 shadow-sm rounded-b-2xl sm:rounded-b-3xl w-full transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('cek')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <img src="/logo.svg" alt="PaperCheck Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div>
              <span className="font-bold text-lg sm:text-xl text-[#ED7B46] tracking-tight leading-none">
                PaperCheck
              </span>
              <p className="text-[11px] text-black font-medium hidden sm:block mt-0.5">
                Academic Integrity Protocol
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Sliding Capsule Indicator */}
          <nav className="hidden md:flex relative items-center gap-1 bg-white/60 backdrop-blur-sm p-1 rounded-full border border-[#ED7B46]/20 shadow-sm">
            {/* Sliding Orange Gradient Capsule */}
            <span
              className={`absolute rounded-full bg-gradient-to-r from-[#ED7B46] to-[#EA580C] shadow-sm shadow-orange-500/25 pointer-events-none ${
                indicatorStyle.animating ? 'transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]' : ''
              }`}
              style={{
                left: `${indicatorStyle.left}px`,
                top: `${indicatorStyle.top}px`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height}px`,
                opacity: indicatorStyle.ready ? 1 : 0,
              }}
            />

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => (tabRefs.current[item.id] = el)}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative z-10 px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-200 select-none ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Network & Wallet */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Network Indicator Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{getNetworkName(walletState.chainId)}</span>
            </div>

            {/* Wallet Button (Desktop only: md:flex, hidden on mobile) */}
            <div className="hidden md:flex items-center">
              {walletState.isConnected ? (
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-[#ED7B46]/25 rounded-xl p-1 pr-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-700 flex items-center justify-center font-mono font-bold text-xs">
                    0x
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-mono font-semibold text-slate-900">
                      {walletState.address.substring(0, 6)}...{walletState.address.substring(walletState.address.length - 4)}
                    </div>
                  </div>
                  <button 
                    onClick={disconnectWallet}
                    title="Disconnect wallet"
                    className="ml-1 text-slate-400 hover:text-slate-600 text-[10px] font-mono"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ED7B46] to-[#EA580C] hover:from-[#E06336] hover:to-[#C2410C] text-white text-xs font-semibold shadow-sm transition-all transform active:scale-95"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button with Orange to Dark Orange Gradient */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-gradient-to-r from-[#ED7B46] to-[#EA580C] hover:from-[#E06336] hover:to-[#C2410C] text-white shadow-sm shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Render Mobile Popup & Full Background Blur using createPortal directly into document.body */}
      {mounted && mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile Backdrop Overlay (Heavy Full-Screen Page Blur behind header) */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-white/60 md:hidden animate-in fade-in duration-200"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
            aria-hidden="true"
          />

          {/* Floating Popup Menu on the Right Side Only */}
          <div
            className="fixed right-4 top-[74px] z-50 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-3xl p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-slate-200/90 space-y-3 animate-in zoom-in-95 fade-in slide-in-from-top-2 duration-200 md:hidden select-none"
          >
            {/* Mobile Wallet Section (Connect / Disconnect) */}
            <div className="pb-1 border-b border-slate-100">
              {walletState.isConnected ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      0x
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 font-mono">Connected</p>
                      <p className="text-[11px] font-mono font-semibold text-slate-900 truncate">
                        {walletState.address.substring(0, 6)}...{walletState.address.substring(walletState.address.length - 4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-mono font-semibold border border-rose-200 transition-colors shrink-0"
                  >
                    Exit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    connectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#ED7B46] to-[#EA580C] hover:from-[#E06336] hover:to-[#C2410C] text-white text-xs font-semibold shadow-sm shadow-orange-500/25 transition-all active:scale-98"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 py-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm shadow-orange-500/20'
                        : 'text-slate-700 hover:text-[#ED7B46] hover:bg-orange-50/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </button>
                );
              })}
            </div>

            {/* Network Indicator Pill */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>Network:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {getNetworkName(walletState.chainId)}
              </span>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
