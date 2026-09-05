import React from 'react';
import { ShieldCheck, Zap, RefreshCw, Terminal, Layers, BookOpen, Activity, LayoutDashboard, Cpu, FlaskConical } from 'lucide-react';
import { RazorpayConfigState } from '../types';

interface HeaderProps {
  config: RazorpayConfigState | null;
  activeTab: 'operations' | 'audit_ledger' | 'architecture' | 'sandbox_lab';
  onSelectTab: (tab: 'operations' | 'audit_ledger' | 'architecture' | 'sandbox_lab') => void;
  selectedSplit: 'held_out' | 'design' | 'live_demo' | 'all';
  onSelectSplit: (split: 'held_out' | 'design' | 'live_demo' | 'all') => void;
  onResetData: () => void;
  isResetting: boolean;
  totalCaseCount: number;
  liveDemoCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  onSelectTab,
  selectedSplit,
  onSelectSplit,
  onResetData,
  isResetting,
  totalCaseCount,
  liveDemoCount,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-slate-900">Razorpay PayPulse</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                Recovery Suite
              </span>
            </div>
          </div>

          {/* Primary Clean Navigation Tabs */}
          <nav id="nav-primary-tabs" className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
            <button
              id="nav-tab-operations"
              onClick={() => onSelectTab('operations')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'operations'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Recovery Queue</span>
            </button>

            <button
              id="nav-tab-audit-ledger"
              onClick={() => onSelectTab('audit_ledger')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit_ledger'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Ledger</span>
            </button>

            <button
              id="nav-tab-architecture"
              onClick={() => onSelectTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>Pipeline Specs</span>
            </button>

            <button
              id="nav-tab-sandbox-lab"
              onClick={() => onSelectTab('sandbox_lab')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sandbox_lab'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sandbox Lab</span>
            </button>
          </nav>

          {/* Right Utility Bar: Split / Cohort Filter & System Status */}
          <div className="flex items-center space-x-2.5">
            {/* Split Switcher (Only relevant when viewing operations or ledger) */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-medium text-slate-400 mr-1">Dataset:</span>
              <button
                id="header-split-held-out"
                onClick={() => onSelectSplit('held_out')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSplit === 'held_out'
                    ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Held-Out (25)
              </button>
              <button
                id="header-split-design"
                onClick={() => onSelectSplit('design')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSplit === 'design'
                    ? 'bg-white text-indigo-800 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Design (25)
              </button>
              <button
                id="header-split-all"
                onClick={() => onSelectSplit('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSplit === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({totalCaseCount})
              </button>
            </div>

            {/* Status indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sandbox Live</span>
            </div>

            {/* Reset data */}
            <button
              id="btn-reset-batch"
              onClick={onResetData}
              disabled={isResetting}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
              title="Reset simulation dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => onSelectTab('operations')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
              activeTab === 'operations' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            Recovery Queue
          </button>
          <button
            onClick={() => onSelectTab('audit_ledger')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
              activeTab === 'audit_ledger' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
            }`}
          >
            Audit Ledger
          </button>
          <button
            onClick={() => onSelectTab('architecture')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
              activeTab === 'architecture' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
            }`}
          >
            Pipeline Specs
          </button>
          <button
            onClick={() => onSelectTab('sandbox_lab')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
              activeTab === 'sandbox_lab' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            Sandbox Lab
          </button>
        </div>
      </div>
    </header>
  );
};
