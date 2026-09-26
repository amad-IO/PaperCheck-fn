'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon, ExternalLink } from 'lucide-react';
import BadgePill from './BadgePill';

export default function StatusCard({ result, onViewExplorer }) {
  if (!result) return null;

  const { status, similarityPercentage, manuscript, participations, sha256, simHash } = result;

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* 1. STATUS CLEAN */}
      {status === 'clean' && (
        <div className="bg-emerald-50/90 border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/60">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950 leading-snug">Clean Paper</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 uppercase whitespace-nowrap shrink-0">
                    No Prior Records
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  This paper fingerprint has never been recorded in any competition registry.
                </p>
              </div>
            </div>
            <div className="font-mono text-xs text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200 self-stretch sm:self-auto text-center shrink-0">
              Similarity Score: <strong className="text-emerald-900">{similarityPercentage || 0}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs font-mono text-emerald-900">
            <div className="p-3 bg-white/70 rounded-xl border border-emerald-200/60">
              <div className="text-[10px] text-emerald-700 uppercase font-semibold">SHA-256 Fingerprint</div>
              <div className="truncate font-semibold mt-0.5 text-slate-800 break-all">{sha256}</div>
            </div>
            <div className="p-3 bg-white/70 rounded-xl border border-emerald-200/60">
              <div className="text-[10px] text-emerald-700 uppercase font-semibold">SimHash 64-Bit</div>
              <div className="truncate font-semibold mt-0.5 text-slate-800">{simHash}</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. STATUS PARTICIPATED */}
      {status === 'participated' && (
        <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-amber-950 leading-snug">Prior History Detected (Identical)</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900 uppercase whitespace-nowrap shrink-0">
                    Exact Match 100%
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  This paper shares an identical cryptographic fingerprint with an entry previously recorded in a competition.
                </p>
              </div>
            </div>
          </div>

          {/* Details & Participations Table */}
          <div className="mt-4 space-y-3">
            <div className="text-xs font-semibold uppercase font-mono text-amber-900 tracking-wider">
              Competition Track Record:
            </div>
            <div className="overflow-x-auto bg-white/80 rounded-xl border border-amber-200 shadow-sm w-full">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-amber-100/60 border-b border-amber-200 text-amber-950 font-semibold font-mono">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Competition</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Year</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Recorder & Credibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-slate-700">
                  {participations && participations.map((part) => (
                    <tr key={part.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">{part.competitionName}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{part.year}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-semibold font-mono text-[10px] whitespace-nowrap ${
                          part.status === 'Winner' || part.status === 'Juara'
                            ? 'bg-amber-200 text-amber-900 border border-amber-300'
                            : part.status === 'Finalist' || part.status === 'Finalis'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {part.status === 'Juara' ? 'Winner' : (part.status === 'Finalis' ? 'Finalist' : part.status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-900">{part.recorderName}</span>
                          <BadgePill badge={part.badge} domain={part.domain} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. STATUS SIMILAR */}
      {status === 'similar' && (
        <div className="bg-rose-50/90 border-2 border-rose-300/80 rounded-2xl p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rose-200/60">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-rose-950 leading-snug">Substantial Similarity Detected</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-200 text-rose-900 uppercase whitespace-nowrap shrink-0">
                    SimHash Match: {similarityPercentage}%
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                  The document has a substantial content similarity of <strong className="underline decoration-rose-500">{similarityPercentage}%</strong> with an academic paper already registered.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/80 rounded-xl border border-rose-200 space-y-2">
            <div className="text-xs font-bold text-rose-900 uppercase font-mono">Matched Registry Entry:</div>
            <div className="text-sm font-bold text-slate-900">{manuscript?.title || 'Registered Academic Paper'}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-mono">
              <span>Institution: {manuscript?.institution || 'Registered Institution'}</span>
              <span>•</span>
              <span>Registered: {new Date(manuscript?.registeredAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Participations of matched paper */}
            <div className="pt-2 border-t border-rose-100 mt-2">
              <div className="text-[11px] font-semibold text-rose-800 mb-1.5">Matched Paper Awards History:</div>
              <div className="flex flex-wrap gap-2">
                {participations && participations.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100/70 text-rose-900 text-[11px] font-mono border border-rose-200/50">
                    <strong>{p.competitionName}</strong> ({p.year}) - <span className="underline">{p.status === 'Juara' ? 'Winner' : (p.status === 'Finalis' ? 'Finalist' : p.status)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Block Explorer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-[11px] text-slate-500 italic">
          {result.manuscript?.txHash 
            ? '*This manuscript is verified on-chain with immutable transaction timestamp.' 
            : '*Clean paper is not yet registered on-chain. Inspect PaperCheck contract on BohrScan.'}
        </p>
        {onViewExplorer && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onViewExplorer}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {result.manuscript?.txHash ? 'View Tx on Explorer' : 'View Contract on Explorer'}
              </span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
