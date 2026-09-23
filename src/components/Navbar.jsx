'use client';

import React, { useState } from 'react';
import { Shield, FileCheck, Award, FileText, Wallet, Menu, X, CheckCircle, ExternalLink } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, walletState, connectWallet, disconnectWallet }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'cek', label: 'Cek Naskah', icon: FileCheck },
    { id: 'daftarkan', label: 'Daftarkan Naskah', icon: Shield },
    { id: 'panitia', label: 'Dashboard Panitia', icon: Award },
    { id: 'detail', label: 'Detail Naskah', icon: FileText },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('cek')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-primary flex items-center justify-center shadow-md shadow-brand-500/20 text-white font-bold transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">LKTI Registry</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  L2 Testnet
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Protokol Integritas Karya Ilmiah</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Network & Wallet */}
          <div className="flex items-center gap-2.5">
            {/* Network Indicator Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Base Sepolia</span>
            </div>

            {/* Wallet Button */}
            {walletState.isConnected ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 pr-3">
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
                  title="Putuskan koneksi"
                  className="ml-1 text-slate-400 hover:text-slate-600 text-[10px] font-mono"
                >
                  Putus
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all transform active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Hubungkan Wallet</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1.5 mb-2 flex items-center justify-between text-xs font-mono text-slate-500 bg-slate-50 rounded-lg">
            <span>Jaringan:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Base Sepolia (84532)
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
