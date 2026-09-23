'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Menu, X, Sun, Moon } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, walletState, connectWallet, disconnectWallet }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    ready: false,
    animating: false,
  });
  const tabRefs = useRef({});

  const navItems = [
    { id: 'cek', label: 'Check Paper' },
    { id: 'daftarkan', label: 'Register Paper' },
    { id: 'panitia', label: 'Committee Dashboard' },
    { id: 'detail', label: 'Paper Details' },
  ];

  useEffect(() => {
    // Explicitly remove legacy theme key if set to dark from earlier test
    if (localStorage.getItem('theme') === 'dark') {
      localStorage.removeItem('theme');
    }
    // Strictly default to light (terang). Never follow OS preference.
    const savedTheme = localStorage.getItem('papercheck_theme');
    const isExplicitlyDark = savedTheme === 'dark';
    setIsDark(isExplicitlyDark);
    if (isExplicitlyDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('papercheck_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('papercheck_theme', 'light');
    }
  };

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
    <header className="sticky top-0 z-50 bg-[#ED7B46]/20 dark:bg-[#1E1E1E]/85 backdrop-blur-md border-b border-[#ED7B46]/25 dark:border-[#ED7B46]/20 shadow-sm transition-colors duration-200">
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
              <p className="text-[11px] text-black dark:text-slate-300 font-medium hidden sm:block mt-0.5">
                Academic Integrity Protocol
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Sliding Capsule Indicator */}
          <nav className="hidden md:flex relative items-center gap-1 bg-white/60 dark:bg-[#262626]/80 backdrop-blur-sm p-1 rounded-full border border-[#ED7B46]/20 dark:border-slate-800 shadow-sm">
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
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Theme Toggle, Network & Wallet */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-white/70 dark:bg-[#262626] hover:bg-white dark:hover:bg-[#303030] border border-[#ED7B46]/20 dark:border-slate-700/80 text-slate-700 dark:text-amber-400 transition-all shadow-sm active:scale-95"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Network Indicator Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Base Sepolia</span>
            </div>

            {/* Wallet Button */}
            {walletState.isConnected ? (
              <div className="flex items-center gap-2 bg-white/70 dark:bg-[#262626] backdrop-blur-sm border border-[#ED7B46]/25 dark:border-slate-700/80 rounded-xl p-1 pr-3">
                <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-700 dark:text-brand-primary flex items-center justify-center font-mono font-bold text-xs">
                  0x
                </div>
                <div className="text-left">
                  <div className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {walletState.address.substring(0, 6)}...{walletState.address.substring(walletState.address.length - 4)}
                  </div>
                </div>
                <button 
                  onClick={disconnectWallet}
                  title="Disconnect wallet"
                  className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-mono"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all transform active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#ED7B46]/20 dark:border-slate-800 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1.5 mb-2 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#262626] rounded-lg">
            <span>Network:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Base Sepolia (84532)
            </span>
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ED7B46] to-[#EA580C] text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
