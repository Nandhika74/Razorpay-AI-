import React, { useState } from 'react';
import { X, Terminal, Zap, CreditCard, Play, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { RAZORPAY_TEST_CARDS } from '../data/seedData';
import { RazorpayConfigState, TestCardPreset } from '../types';

interface RazorpaySandboxLabProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBackToQueue?: () => void;
  config: RazorpayConfigState | null;
  onTriggerTestCard: (testCardId: string, customerName: string, amountINR: number, cardNetwork: string) => Promise<void>;
  isTriggering: boolean;
  inline?: boolean;
}

export const RazorpaySandboxLab: React.FC<RazorpaySandboxLabProps> = ({
  isOpen = true,
  onClose,
  onBackToQueue,
  config,
  onTriggerTestCard,
  isTriggering,
  inline = false,
}) => {
  if (!isOpen && !inline) return null;

  const [selectedCardId, setSelectedCardId] = useState<string>('tc_insufficient_funds');
  const [customerName, setCustomerName] = useState<string>('Sandbox Test Customer');
  const [amountINR, setAmountINR] = useState<number>(4999);
  const [lastExecutedResult, setLastExecutedResult] = useState<string | null>(null);

  const selectedCard = RAZORPAY_TEST_CARDS.find((c) => c.id === selectedCardId) || RAZORPAY_TEST_CARDS[0];

  const handleReturn = () => {
    if (onBackToQueue) {
      onBackToQueue();
    } else if (onClose) {
      onClose();
    }
  };

  const handleRunSimulation = async () => {
    setLastExecutedResult(null);
    await onTriggerTestCard(selectedCard.id, customerName, amountINR, selectedCard.network);
    setLastExecutedResult(`Successfully ingested Sandbox Decline (${selectedCard.expectedErrorCode}) and routed through 4-stage recovery pipeline!`);
  };

  const content = (
    <div id="sandbox-lab-modal" className={`bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col ${inline ? 'rounded-2xl max-w-3xl mx-auto w-full' : 'rounded-3xl shadow-2xl w-full max-w-2xl my-auto'}`}>
      {/* Top Navigation Bar for Inline / Modal */}
      <div className="px-5 pt-4 pb-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Recovery Queue</span>
        </button>
        <span className="text-[11px] font-semibold text-slate-400">Sandbox Decline Simulation Mode</span>
      </div>

      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">Razorpay Sandbox Test-Card Runner</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Trigger real Razorpay decline taxonomy events to verify autonomous 4-stage pipeline triage.
            </p>
          </div>
        </div>
        {(onClose || onBackToQueue) && (
          <button 
            onClick={handleReturn} 
            title="Cancel / Close"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs bg-[#f8fafc]">
          {/* API Environment Banner */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${config?.hasKeyId ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              <span className="font-bold text-slate-800 text-xs">
                {config?.hasKeyId ? 'Razorpay Live Sandbox Connected' : 'Embedded Razorpay Sandbox Engine'}
              </span>
            </div>
            <span className="font-mono text-slate-400 text-xs font-semibold">
              {config?.hasKeyId ? `Key: ${config.keyIdMasked}` : 'Ready for test injection'}
            </span>
          </div>

          {/* Test Card Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Select Razorpay Sandbox Test Card:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {RAZORPAY_TEST_CARDS.map((tc) => {
                const isSelected = tc.id === selectedCardId;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setSelectedCardId(tc.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 truncate max-w-[170px]">{tc.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                        {tc.network}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-indigo-600 font-semibold mb-1">{tc.cardNumber}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-normal font-medium">{tc.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Test Customer Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Billing Amount (₹):</label>
              <input
                type="number"
                value={amountINR}
                onChange={(e) => setAmountINR(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Expected Pipeline Route */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 shadow-2xs">
            <span className="font-bold text-indigo-950 block text-xs">Expected 4-Stage Triage Route:</span>
            <div className="flex items-center space-x-2 text-indigo-900 font-mono text-xs">
              <span>Taxonomy: <strong className="font-bold text-indigo-700">{selectedCard.expectedErrorCode}</strong></span>
              <span className="text-slate-400">→</span>
              <span>Target Zone: <strong className="font-bold text-indigo-700">{selectedCard.expectedZone}</strong></span>
            </div>
            <p className="text-indigo-800 text-xs leading-relaxed font-medium">
              Upon trigger, this payment failure webhook is synthesized, adjusted against customer baseline, categorized, scored, and audited with zero compliance violations.
            </p>
          </div>

          {lastExecutedResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{lastExecutedResult}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back / Cancel</span>
            </button>

            {lastExecutedResult && (
              <button
                type="button"
                onClick={handleReturn}
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-xl border border-indigo-200 transition-colors"
              >
                <span>View in Queue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            )}
          </div>

          <button
            id="btn-fire-test-card"
            onClick={handleRunSimulation}
            disabled={isTriggering}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? 'Executing Sandbox Pipeline...' : 'Inject Test Failure Event'}</span>
          </button>
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div id="sandbox-lab-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {content}
    </div>
  );
};
