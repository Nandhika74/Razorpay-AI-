import React from 'react';
import { ArrowRight, Search, ShieldCheck, TrendingUp, Sliders, CheckCircle2, XCircle, ArrowUpRight, Zap } from 'lucide-react';

export const PipelineStageFlow: React.FC = () => {
  return (
    <div id="pipeline-stage-flow" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h2 className="text-base font-bold text-slate-800">4-Stage Bounded Recovery Pipeline</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Narrowing pool at each stage • Spending retry capacity only where justified • Scheme-compliant stopping
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-semibold">
            Webhook: payment.failed
          </span>
          <span className="text-slate-300">→</span>
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
            Output: Verified ₹ Ledger
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stage 1 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stage 1</span>
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-bold border border-indigo-100">1</span>
          </div>
          <h3 className="text-xs font-bold text-slate-800 mb-1">Context Diagnosis</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3 font-normal">
            Interprets decline against customer baseline (tenure + historic success). Calculates <em className="text-slate-700 font-medium">Surprise Index</em> (blip vs decaying pattern).
          </p>
          <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            Surprise = f(Baseline, Tenure, Error)
          </div>
        </div>

        {/* Stage 2 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stage 2</span>
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-bold border border-indigo-100">2</span>
          </div>
          <h3 className="text-xs font-bold text-slate-800 mb-1">Zone Classification</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3 font-normal">
            Categorizes into 4 zones based on Razorpay taxonomy. Permanently filters out Hard Declines (stolen/closed/MAC 21).
          </p>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">Never Retry</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">Retry Soon</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">Retry Later</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">Action Req</span>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Stage 3</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center justify-center font-bold border border-emerald-100">3</span>
          </div>
          <h3 className="text-xs font-bold text-slate-800 mb-1">Dual-Score Ranking</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3 font-normal">
            Computes two orthogonal outputs: <strong className="text-slate-700 font-semibold">Likelihood %</strong> (recovery probability) and <strong className="text-slate-700 font-semibold">Priority Rank</strong> (value-at-risk × urgency).
          </p>
          <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex justify-between">
            <span>P(Succ): 0-100%</span>
            <span>Priority: 0-100</span>
          </div>
        </div>

        {/* Stage 4 */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Stage 4</span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 text-xs flex items-center justify-center font-bold border border-amber-100">4</span>
          </div>
          <h3 className="text-xs font-bold text-slate-800 mb-1">Bounded Ceilings</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3 font-normal">
            Enforces hard Visa (15) / Mastercard (10) 30-day limits. On ceiling reached: automated clean handoff to CS team.
          </p>
          <div className="text-[10px] font-mono text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200 shadow-2xs font-semibold">
            Visa: ≤15/30d • MC: ≤10/30d
          </div>
        </div>
      </div>
    </div>
  );
};
