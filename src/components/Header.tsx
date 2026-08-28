import React from 'react';
import { ShieldCheck, Zap, RefreshCw, Terminal, Layers, BookOpen, Activity } from 'lucide-react';
import { RazorpayConfigState } from '../types';

interface HeaderProps {
  config: RazorpayConfigState | null;
  selectedSplit: 'held_out' | 'design' | 'all';
  onSelectSplit: (split: 'held_out' | 'design' | 'all') => void;
  onOpenSandboxLab: () => void;
  onOpenHeldOutLedger: () => void;
  onOpenDocs: () => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  selectedSplit,
  onSelectSplit,
  onOpenSandboxLab,
  onOpenHeldOutLedger,
  onOpenDocs,
  onResetData,
  isResetting,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-lg tracking-tight text-slate-800">Razorpay PayPulse</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Track 03 Recovery
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">
                Context-Adjusted Dunning • 4-Stage Bounded Execution • Network Ceilings
              </p>
            </div>
          </div>

          {/* Center: Split Switcher */}
          <div className="hidden md:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              id="split-btn-held-out"
              onClick={() => onSelectSplit('held_out')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedSplit === 'held_out'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Held-Out Split (Eval)</span>
              </span>
            </button>
            <button
              id="split-btn-design"
              onClick={() => onSelectSplit('design')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedSplit === 'design'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <span>Design Split (Tuning)</span>
            </button>
            <button
              id="split-btn-all"
              onClick={() => onSelectSplit('all')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedSplit === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <span>All Cases (60)</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2.5">
            {/* Status Pills */}
            <div className="hidden lg:flex items-center space-x-2">
              <span
                title={config?.hasKeyId ? `Key: ${config.keyIdMasked}` : 'Embedded Sandbox Active'}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-100"
              >
                <span className={`w-2 h-2 rounded-full ${config?.hasKeyId ? 'bg-emerald-500' : 'bg-emerald-500 animate-pulse'}`} />
                {config?.hasKeyId ? 'API Live' : 'Sandbox Ready'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-100">
                <span className={`w-2 h-2 rounded-full ${config?.hasGeminiKey ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                Gemini 3.7
              </span>
            </div>

            {/* Test Lab Trigger */}
            <button
              id="btn-open-sandbox-lab"
              onClick={onOpenSandboxLab}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 shadow-2xs transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span>Sandbox Lab</span>
            </button>

            {/* Held Out Audit Ledger */}
            <button
              id="btn-open-held-out-ledger"
              onClick={onOpenHeldOutLedger}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 shadow-2xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Audit Ledger</span>
            </button>

            {/* Architecture Specs */}
            <button
              id="btn-open-architecture-docs"
              onClick={onOpenDocs}
              className="inline-flex items-center p-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Architecture & Pipeline Specification"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
            </button>

            {/* Reset */}
            <button
              id="btn-reset-batch"
              onClick={onResetData}
              disabled={isResetting}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              title="Reset simulation dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
