'use client';

import React from 'react';
import { CheckCircle2, Award, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Badge Sumber Pencatat Kredibilitas
 * Types:
 * - domain_verified: Wallet cocok dengan domain institusi (unm.ac.id)
 * - attested: Ada attestation dari institusi terpercaya
 * - anonymous: Wallet biasa, tampilkan peringatan "klaim belum diverifikasi"
 * - disputed: Pendaftar asli membantah klaim ini
 */
export default function BadgePill({ badge, domain }) {
  switch (badge) {
    case 'domain_verified':
      return (
        <span 
          title={`Pencatat terverifikasi via domain institusi: ${domain || 'resmi'}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Terverifikasi Domain</span>
          {domain && <span className="text-emerald-600/70 font-sans">({domain})</span>}
        </span>
      );

    case 'attested':
      return (
        <span 
          title="Telah menerima pengesahan attestation dari institusi tepercaya"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200"
        >
          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Terattestasi</span>
        </span>
      );

    case 'disputed':
      return (
        <span 
          title="Klaim partisipasi ini telah dibantah resmi oleh pemilik pendaftaran pertama"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Dibantah Pendaftar</span>
        </span>
      );

    case 'anonymous':
    default:
      return (
        <span 
          title="Pencatat menggunakan wallet biasa. Klaim belum diverifikasi otoritas kampus."
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
        >
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Anonim (Belum Terverifikasi)</span>
        </span>
      );
  }
}
