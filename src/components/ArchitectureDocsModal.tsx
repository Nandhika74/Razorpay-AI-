import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, CheckCircle2, AlertTriangle, Terminal, Scale } from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div id="architecture-docs-backdrop" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="architecture-docs-modal" className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Razorpay AI Revenue Recovery Architecture</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Track 03 • Failed-Subscription Recovery Agent System Specification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-600 leading-relaxed bg-[#f8fafc]">
          {/* Section 1: Problem & Approach */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>1. The Problem & Context-Adjusted Core Hypothesis</span>
            </h3>
            <p>
              10–15% of recurring payments fail on the first attempt, causing 20–40% of all subscription churn to be involuntary. Treating every failure identically causes two catastrophic failures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500 font-medium">
              <li><strong className="text-slate-800">Blind Retries:</strong> Burns through card scheme retry caps (Visa 15 / Mastercard 10 per 30d), risking $5,000–$75,000/mo in Merchant Monitoring Program (VMMP) fines.</li>
              <li><strong className="text-slate-800">Naive Generic Timing:</strong> Retrying an insufficient funds failure immediately burns attempts before the customer's salary cycle.</li>
            </ul>
            <p className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-indigo-950 font-medium shadow-2xs">
              <strong className="text-indigo-900 font-bold">Core Innovation:</strong> Context-adjusted diagnosis. An <code>insufficient_fund</code> code from a 2-year loyal customer with 95% success rate is an <em>anomalous blip</em> warranting an automated payday retry. The same code from a chronic 40% customer triggers actionable outreach or CS intervention.
            </p>
          </div>

          {/* Section 2: 4-Stage Pipeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>2. The 4-Stage Pipeline Engine</span>
            </h3>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div>
                  <strong className="text-slate-800 font-bold">Stage 1 — Context-Adjusted Diagnosis:</strong> Ingests raw Razorpay error schema (<code>code</code>, <code>source</code>, <code>step</code>, <code>reason</code>) + customer payment history to compute the <em>Surprise Index</em>.
                </div>
                <div className="font-mono text-[11px] text-indigo-700 bg-white p-2 rounded-lg border border-slate-200">
                  Surprise = Historical Success Rate × min(Tenure/12, 1) × (1 - Failures/10)
                  <span className="block text-[9.5px] text-slate-400 font-sans mt-0.5">*Hard decline override: 0.0. Anomaly blip threshold: ≥ 0.70.</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-800 font-bold">Stage 2 — Zone Classification:</strong> Triage into 4 zones (<code>Never Retry</code>, <code>Retry Soon</code>, <code>Retry Later</code>, <code>Needs Action</code>). Hard declines (stolen/closed/MAC 21) exit here permanently with zero retries.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div>
                  <strong className="text-slate-800 font-bold">Stage 3 — Dual-Score Trend Assessment:</strong> Computes two distinct orthogonal metrics: <strong>Recovery Likelihood %</strong> (empirical statistical probability) and <strong>Recovery Priority Rank</strong> (additive 0–100 queue priority).
                </div>
                <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                  Priority Rank = min(100, Normalized Value [0–60 pts] + Dunning Urgency [0–40 pts])
                  <span className="block text-[9.5px] text-slate-400 font-sans mt-0.5">*Where Value = min(60, [Amount/8000]×60) and Urgency = min(40, [14 - DaysLeft] × [40/13]). Zone NEVER_RETRY = 0.</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-800 font-bold">Stage 4 — Bounded Execution & Network Compliance:</strong> Enforces Visa 15 / Mastercard 10 rolling-30D retry ceilings* and MAC 21 stop-codes. On ceiling hit, cleanly escalates to CS rather than burning attempts or violating card scheme rules.
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  *Configured per published network merchant guidelines (Visa Rules & Mastercard Transaction Processing Rules).
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Razorpay Error Taxonomy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>3. Razorpay Error Taxonomy & Response Matrix</span>
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Decline Code</th>
                    <th className="py-2.5 px-3.5">Source</th>
                    <th className="py-2.5 px-3.5">Zone</th>
                    <th className="py-2.5 px-3.5">Optimal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">insufficient_fund</td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sans">Customer</td>
                    <td className="py-2.5 px-3.5 text-amber-700 font-bold">RETRY_LATER</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-sans font-medium">Align with salary/payday window</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">gateway_technical_error</td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sans">Gateway/Bank</td>
                    <td className="py-2.5 px-3.5 text-indigo-600 font-bold">RETRY_SOON</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-sans font-medium">Exponential backoff retry (30m-2h)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">authentication_failed</td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sans">Customer</td>
                    <td className="py-2.5 px-3.5 text-purple-700 font-bold">NEEDS_ACTION</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-sans font-medium">Interactive WhatsApp/SMS 1-click link</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">card_stolen / card_closed</td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sans">Bank</td>
                    <td className="py-2.5 px-3.5 text-rose-700 font-bold">NEVER_RETRY</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-sans font-medium">Zero retries (Strict Compliance Stop)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">customer_cancelled (MAC 21)</td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-sans">Customer</td>
                    <td className="py-2.5 px-3.5 text-rose-700 font-bold">NEVER_RETRY</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-sans font-medium">Mandatory stop on explicit cancellation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
