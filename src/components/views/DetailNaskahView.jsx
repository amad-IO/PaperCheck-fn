'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Hash, ShieldAlert, CheckCircle2, User, ExternalLink, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { getRegistry, disputeClaimLocal } from '../../lib/mockRegistry';
import BadgePill from '../BadgePill';

export default function DetailNaskahView({ walletState, showToast }) {
  const [registryList, setRegistryList] = useState([]);
  const [selectedHash, setSelectedHash] = useState('');
  const [currentManuscript, setCurrentManuscript] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [targetParticipation, setTargetParticipation] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');

  useEffect(() => {
    const list = getRegistry();
    setRegistryList(list);
    if (list.length > 0) {
      setSelectedHash(list[0].contentHash);
      setCurrentManuscript(list[0]);
    }
  }, []);

  const handleSelectManuscript = (hash) => {
    setSelectedHash(hash);
    const found = registryList.find(item => item.contentHash === hash);
    setCurrentManuscript(found || null);
  };

  const handleOpenDispute = (part) => {
    // Check if the current connected wallet is the original registrant
    const isOriginalRegistrant = walletState.isConnected && 
      walletState.address.toLowerCase() === (currentManuscript?.registrant || '').toLowerCase();

    if (!isOriginalRegistrant) {
      showToast(
        'Akses Dibatasi', 
        'Hanya pemilik wallet yang pertama kali mendaftarkan naskah ini yang memiliki hak membantah klaim.', 
        'warning'
      );
      return;
    }

    setTargetParticipation(part);
    setDisputeModalOpen(true);
  };

  const submitDispute = () => {
    if (!targetParticipation || !currentManuscript) return;

    const success = disputeClaimLocal(
      currentManuscript.contentHash, 
      targetParticipation.id, 
      disputeNote || 'Dibantah oleh pendaftar asli.'
    );

    if (success) {
      showToast('Bantahan Tercatat', 'Klaim partisipasi ini resmi diberi label "Dibantah" di smart contract.', 'success');
      // Refresh
      const updatedList = getRegistry();
      setRegistryList(updatedList);
      const updatedCurrent = updatedList.find(item => item.contentHash === currentManuscript.contentHash);
      setCurrentManuscript(updatedCurrent);
    }

    setDisputeModalOpen(false);
    setDisputeNote('');
  };

  const isOwner = walletState.isConnected && 
    walletState.address.toLowerCase() === (currentManuscript?.registrant || '').toLowerCase();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <section className="text-center space-y-2 pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Detail Naskah & Riwayat Lomba
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Audit linimasa riwayat keikutsertaan naskah ilmiah dan penyelesaian sengketa klaim sepihak.
        </p>
      </section>

      {/* Select / Search Naskah Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 font-mono whitespace-nowrap">Pilih Naskah:</span>
          <select
            value={selectedHash}
            onChange={(e) => handleSelectManuscript(e.target.value)}
            className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-primary"
          >
            {registryList.map(item => (
              <option key={item.contentHash} value={item.contentHash}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        {currentManuscript && (
          <div className="text-xs font-mono text-slate-500">
            {isOwner ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Wallet Anda adalah Pemilik Asli
              </span>
            ) : (
              <span className="text-slate-400">Mode Pratinjau Publik</span>
            )}
          </div>
        )}
      </div>

      {currentManuscript && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          
          {/* Metadata Header */}
          <div className="border-b border-slate-100 pb-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 uppercase">
                {currentManuscript.category}
              </span>
              <span className="text-xs font-mono text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Terdaftar: {new Date(currentManuscript.registeredAt).toLocaleDateString('id-ID')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentManuscript.title}
            </h2>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 font-mono pt-1">
              <div>Penulis: <strong className="text-slate-900">{currentManuscript.author}</strong></div>
              <div>Instansi: <strong className="text-slate-900">{currentManuscript.institution}</strong></div>
              <div className="truncate max-w-xs">
                Registrant: <span className="text-brand-700">{currentManuscript.registrant}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Content Hash (SHA-256)</span>
              <div className="text-[11px] text-brand-700 font-bold break-all">{currentManuscript.contentHash}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">SimHash Fingerprint</span>
              <div className="text-[11px] text-slate-800 font-bold">{currentManuscript.simHash}</div>
            </div>
          </div>

          {/* Linimasa Riwayat Lomba (Timeline) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Linimasa Riwayat Partisipasi ({currentManuscript.participations?.length || 0} Acara):
            </h3>

            {(!currentManuscript.participations || currentManuscript.participations.length === 0) ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 font-mono">
                Belum ada panitia yang mencatat keikutsertaan naskah ini pada kompetisi manapun.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3.5 sm:ml-4 space-y-6 pb-2">
                {currentManuscript.participations.map((part) => (
                  <div key={part.id} className="relative pl-6 sm:pl-8">
                    {/* Timeline Node */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-primary"></div>

                    {/* Timeline Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{part.competitionName}</h4>
                            <span className="font-mono text-xs text-slate-400">({part.year})</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            Kategori: {part.category}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold self-start sm:self-auto ${
                          part.status === 'Juara'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : part.status === 'Finalis'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Status: {part.status}
                        </span>
                      </div>

                      {/* Source & Kredibilitas */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Pencatat:</span>
                          <span className="font-medium text-slate-900">{part.recorderName}</span>
                          <BadgePill badge={part.badge} domain={part.domain} />
                        </div>

                        {/* Dispute Button */}
                        {!part.isDisputed && (
                          <button
                            onClick={() => handleOpenDispute(part)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-mono font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Bantah Klaim Ini</span>
                          </button>
                        )}
                      </div>

                      {/* Dispute Note if marked */}
                      {part.isDisputed && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono">
                          <strong>Klaim Dibantah oleh Pendaftar:</strong> {part.disputeNote || 'Pendaftar menyatakan klaim kepesertaan ini tidak sah atau keliru.'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Bantah Klaim Keikutsertaan</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan mengajukan bantahan resmi on-chain terhadap pencatatan dari panitia <strong>{targetParticipation?.recorderName}</strong> pada acara <strong>{targetParticipation?.competitionName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Bantahan (Opsional):</label>
              <textarea
                rows={3}
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="Contoh: Kami tidak pernah mengirimkan berkas naskah ini ke kompetisi tersebut..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={submitDispute}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Tandatangani Bantahan On-Chain
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
