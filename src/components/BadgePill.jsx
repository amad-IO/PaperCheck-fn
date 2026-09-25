'use client';

import React from 'react';
import { CheckCircle2, Award, AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Recorder Credibility Badge Pill
 * Types:
 * - domain_verified: Wallet matches institution domain (e.g. unm.ac.id)
 * - attested: Holds recognized institution attestation
 * - anonymous: Standard wallet, displays "claim unverified" notice
 * - disputed: The original author disputed this claim
 */
export default function BadgePill({ badge, domain }) {
  switch (badge) {
    case 'domain_verified':
      return (
        <span 
          title={`Recorder verified via official domain: ${domain || 'official'}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Domain Verified</span>
          {domain && <span className="text-emerald-600/70 font-sans">({domain})</span>}
        </span>
      );

    case 'attested':
      return (
        <span 
          title="Verified via trusted institutional attestation"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200"
        >
          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Attested</span>
        </span>
      );

    case 'disputed':
      return (
        <span 
          title="This participation claim has been officially disputed by the original registrant"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Claim Disputed</span>
        </span>
      );

    case 'anonymous':
    default:
      return (
        <span 
          title="Recorded using a standard wallet. Claim not yet verified by an academic authority."
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
        >
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Anonymous (Unverified)</span>
        </span>
      );
  }
}
