import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Send,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Mail,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecoveryCase } from '../types';

interface CaseDetailModalProps {
  caseItem: RecoveryCase | null;
  onClose: () => void;
  onExecuteAction: (caseId: string, actionType: string, customNote?: string) => Promise<void>;
  onGenerateAIOutreach: (caseId: string, channel: string, language: string) => Promise<void>;
  isLoadingAction: boolean;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onExecuteAction,
  onGenerateAIOutreach,
  isLoadingAction,
}) => {
  if (!caseItem) return null;

  const [activeTab, setActiveTab] = useState<'decision_tree' | 'ai_outreach' | 'audit_trail'>('decision_tree');
  const [outreachChannel, setOutreachChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [outreachLanguage, setOutreachLanguage] = useState<'english' | 'hinglish'>('english');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHardDecline = caseItem.classification.zone === 'NEVER_RETRY';

  const handleAction = async (actionType: string, note?: string) => {
    setActionError(null);
    try {
      await onExecuteAction(caseItem.id, actionType, note);
      if (actionType === 'SMART_RETRY' || actionType === 'SIMULATE_CUSTOMER_PAY') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      setActionError(err.message || 'Action blocked by compliance rules');
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setActionError(null);
    try {
      await onGenerateAIOutreach(caseItem.id, outreachChannel, outreachLanguage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div id="case-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="case-detail-modal" className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm shadow-indigo-200">
              {caseItem.customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="font-bold text-slate-800 text-lg">{caseItem.customer.name}</h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold">
                  {caseItem.id}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {caseItem.batchSplit === 'held_out' ? 'Held-Out Split' : 'Design Split'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {caseItem.customer.email} • {caseItem.customer.phone} • {caseItem.customer.planName} (₹{caseItem.customer.amountINR.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-close-case-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-100 px-6 flex space-x-8 text-xs font-bold bg-white">
          <button
            id="tab-btn-decision-tree"
            onClick={() => setActiveTab('decision_tree')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'decision_tree'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4-Stage Decision & Compliance</span>
          </button>
          <button
            id="tab-btn-ai-outreach"
            onClick={() => setActiveTab('ai_outreach')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'ai_outreach'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Smart Outreach Synthesizer</span>
          </button>
          <button
            id="tab-btn-audit-trail"
            onClick={() => setActiveTab('audit_trail')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'audit_trail'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Immutable Audit Trail ({caseItem.auditTrail.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-5">
          {/* Action Error Notification */}
          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start space-x-3 shadow-sm animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-900 block mb-0.5">
                  Scheme Compliance Circuit Breaker Triggered
                </span>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">{actionError}</p>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-700 text-xs font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* Hard Decline Permanent Circuit Breaker Banner */}
          {isHardDecline && (
            <div className="p-4 rounded-2xl bg-rose-900 text-white flex items-start space-x-3.5 shadow-lg border border-rose-950">
              <div className="w-6 h-6 rounded-xl bg-rose-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                🛑
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-widest text-rose-200">
                    Mandatory Scheme Hard Stop Enforced (MAC 21 / Stolen Card)
                  </span>
                  <span className="bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    0 Retries Allowed
                  </span>
                </div>
                <p className="text-xs text-rose-100 font-medium leading-relaxed">
                  This payment instrument is permanently deactivated ({caseItem.failureEvent.decline.reason}). All automated retries, customer 1-click debit links, and recovery dunning are strictly blocked to protect your MID from Visa/Mastercard VMMP fines ($5,000–$75,000/mo).
                </p>
                <p className="text-[11px] text-rose-300 font-semibold">
                  Compliant Path: Route case to Customer Success to guide customer through onboarding a brand new payment method.
                </p>
              </div>
            </div>
          )}

          {/* Settled / Recovered Banner */}
          {caseItem.status === 'RECOVERED' && (
            <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-start space-x-3.5 shadow-lg border border-emerald-950">
              <div className="w-6 h-6 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">
                    Terminal State: Payment Settled & Revenue Captured
                  </span>
                  <span className="bg-emerald-800 text-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} Secured
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Method: {caseItem.recoveryMethod || 'Direct Authorization'}. Invoice is fully resolved. All dunning and retry actions are locked to prevent double-billing and customer friction.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: DECISION TREE & COMPLIANCE */}
          {activeTab === 'decision_tree' && (
            <div className="space-y-5">
              {/* Context Diagnostic Summary: Baseline vs Failure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Customer Baseline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                    Customer Baseline Context (Stage 1)
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Historical Reliability:</span>
                      <span className="font-bold text-slate-800">{Math.round(caseItem.customer.historicalSuccessRate * 100)}% Success Rate</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Tenure & History:</span>
                      <span className="font-bold text-slate-800">{caseItem.customer.tenureMonths} mos ({caseItem.customer.successfulHistoricalPayments}/{caseItem.customer.totalHistoricalPayments} paid)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Surprise Index:</span>
                      <span className={`font-bold ${caseItem.diagnosis.isAnomalousBlip ? 'text-amber-700' : 'text-slate-700'}`}>
                        {Math.round(caseItem.diagnosis.surpriseScore * 100)}% {caseItem.diagnosis.isAnomalousBlip ? '(Isolated Blip)' : '(Chronic Friction)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Card & Mandate:</span>
                      <span className="font-mono font-bold text-slate-700">{caseItem.customer.cardNetwork} •••• {caseItem.customer.cardLast4}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Razorpay Decline Event */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                    Raw Razorpay Decline Signal (Stage 2)
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Error Reason:</span>
                      <span className="font-bold text-rose-700 font-mono">{caseItem.failureEvent.decline.reason}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Razorpay Error Code:</span>
                      <span className="font-mono text-slate-800 text-xs font-semibold">{caseItem.failureEvent.decline.code}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Triage Zone:</span>
                      <span className="font-bold text-indigo-600">{caseItem.classification.zone}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Hard Decline Stop:</span>
                      <span className={`font-bold ${caseItem.classification.isHardDecline ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {caseItem.classification.isHardDecline ? 'YES (0 Retries Allowed)' : 'NO (Recoverable Soft Decline)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 1 Diagnosis Reasoning Callout */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-3 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  i
                </div>
                <div>
                  <span className="font-bold text-indigo-900 block mb-0.5">Context Diagnosis Summary:</span>
                  <p className="text-indigo-800 leading-relaxed font-medium">{caseItem.diagnosis.explanation}</p>
                </div>
              </div>

              {/* Stage 3 & 4 Dual Outputs + Network Ceilings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Likelihood */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Recovery Likelihood
                  </span>
                  <div className="text-3xl font-black text-emerald-600 my-1">
                    {caseItem.trendScore.recoveryLikelihoodPct}%
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Statistical probability of success</p>
                </div>

                {/* Priority Score */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Recovery Priority Rank
                  </span>
                  <div className="text-3xl font-black text-indigo-600 my-1">
                    {caseItem.trendScore.recoveryPriorityScore}/100
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} × {caseItem.trendScore.daysRemainingInDunning}d left
                  </p>
                </div>

                {/* Network Compliance Meter */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {caseItem.compliance.network} 30D Limit
                  </span>
                  <div className={`text-3xl font-black my-1 ${isHardDecline ? 'text-rose-600' : caseItem.compliance.isCeilingReached ? 'text-amber-600' : 'text-slate-800'}`}>
                    {caseItem.compliance.attemptCount} / {caseItem.compliance.maxAllowedAttempts}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isHardDecline 
                      ? 'Hard Stop (0 retries permitted)'
                      : caseItem.compliance.isCeilingReached 
                      ? 'Ceiling reached — Escalated to CS' 
                      : `${caseItem.compliance.attemptsRemaining} retry attempts remaining`}
                  </p>
                </div>
              </div>

              {/* Action Simulator Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    Pipeline Execution Controls
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    Current Status: <span className="font-bold text-slate-800">{caseItem.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Action 1: Smart Retry */}
                  <button
                    id="btn-action-smart-retry"
                    onClick={() => handleAction('SMART_RETRY')}
                    disabled={isLoadingAction || caseItem.compliance.isCeilingReached || isHardDecline || caseItem.status === 'RECOVERED'}
                    className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-2xs"
                  >
                    <Zap className="w-5 h-5 text-indigo-600" />
                    <span>Execute Smart Retry</span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      {isHardDecline ? '🛑 Blocked (Hard Decline)' : 'Silent gateway / scheme re-auth'}
                    </span>
                  </button>

                  {/* Action 2: Simulate Customer 1-Click Link Pay */}
                  <button
                    id="btn-action-simulate-customer-pay"
                    onClick={() => handleAction('SIMULATE_CUSTOMER_PAY')}
                    disabled={isLoadingAction || isHardDecline || caseItem.status === 'RECOVERED'}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-2xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Simulate 1-Click Pay</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      {isHardDecline ? '🛑 Blocked (Invalid Instrument)' : 'Customer authorizes via WhatsApp/SMS'}
                    </span>
                  </button>

                  {/* Action 3: Human CS Escalation */}
                  <button
                    id="btn-action-escalate-human"
                    onClick={() => handleAction('ESCALATE_HUMAN')}
                    disabled={isLoadingAction || caseItem.status === 'HANDED_OFF_CEILING' || caseItem.status === 'RECOVERED'}
                    className={`p-4 rounded-xl border font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-center shadow-2xs ${
                      isHardDecline
                        ? 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                        : 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900'
                    }`}
                  >
                    <UserCheck className={`w-5 h-5 ${isHardDecline ? 'text-white' : 'text-amber-700'}`} />
                    <span>{isHardDecline ? 'Escalate for Card Swap' : 'Escalate to CS Rep'}</span>
                    <span className={`text-[10px] font-normal ${isHardDecline ? 'text-indigo-100' : 'text-amber-800'}`}>
                      {isHardDecline ? 'Compliant handoff for new mandate' : 'Clean handoff without retry spam'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI OUTREACH GENERATOR */}
          {activeTab === 'ai_outreach' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Gemini 3.7 Contextual Outreach Synthesizer</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {isHardDecline 
                        ? 'Generates card-replacement onboarding notifications informing customer of compromised payment method.'
                        : 'Creates empathetic, personalized recovery notifications matching customer tenure and error context.'}
                    </p>
                  </div>
                  <button
                    id="btn-generate-ai-outreach"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'Synthesizing...' : 'Generate New Draft'}</span>
                  </button>
                </div>

                {/* Generator Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Target Channel:</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setOutreachChannel('whatsapp')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center space-x-1.5 transition-all ${
                          outreachChannel === 'whatsapp'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setOutreachChannel('email')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center space-x-1.5 transition-all ${
                          outreachChannel === 'email'
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Email</span>
                      </button>
                      <button
                        onClick={() => setOutreachChannel('sms')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center space-x-1.5 transition-all ${
                          outreachChannel === 'sms'
                            ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                        <span>SMS Link</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Tone & Language:</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setOutreachLanguage('english')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs transition-all ${
                          outreachLanguage === 'english'
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        English (Professional)
                      </button>
                      <button
                        onClick={() => setOutreachLanguage('hinglish')}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs transition-all ${
                          outreachLanguage === 'hinglish'
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        Hinglish (Conversational)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Body Preview */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Synthesized Message:</span>
                    <button
                      onClick={() => copyToClipboard(caseItem.outreachDraft?.messageBody || '')}
                      className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                    {caseItem.outreachDraft?.messageBody ||
                      (isHardDecline
                        ? `Hi ${caseItem.customer.name},\n\nWe noticed your recurring subscription payment for ${caseItem.customer.planName} (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) was halted because the payment card on file has been reported inactive/cancelled by your issuing bank.\n\nTo keep your access uninterrupted, please set up a replacement payment method here:\n\n👉 https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}\n\nOur support team is also on standby to assist you directly.`
                        : `Hi ${caseItem.customer.name},\n\nYour recurring subscription payment for ${caseItem.customer.planName} (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) couldn't be processed due to a temporary bank authorization notice (${caseItem.failureEvent.decline.reason}).\n\nTo ensure your service remains uninterrupted, please refresh your payment method via this secure 1-click link:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nNeed assistance? Reply to this message anytime.`)}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
                    <span>
                      Deep-Link:{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                        {isHardDecline 
                          ? `https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}`
                          : `https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}`}
                      </code>
                    </span>
                    <button
                      onClick={() => handleAction('DISPATCH_COMMUNICATION', `Sent via ${outreachChannel} in ${outreachLanguage}`)}
                      disabled={isLoadingAction || isHardDecline || caseItem.status === 'RECOVERED'}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>{isHardDecline ? '🛑 Direct Dispatch Blocked' : 'Dispatch to Customer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
          {activeTab === 'audit_trail' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Deterministic Audit Ledger</h3>
                <span className="text-xs font-mono text-slate-400 font-medium">
                  {caseItem.auditTrail.length} Recorded Trace Events
                </span>
              </div>

              <div className="space-y-3">
                {caseItem.auditTrail.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {entry.stage}
                        </span>
                        <span>{entry.stageName}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700">
                      <span className="font-mono font-bold text-xs text-indigo-600">{entry.action}</span>
                      <span className="text-slate-300">→</span>
                      <span className="font-bold text-slate-800">{entry.resultStatus}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-medium">{entry.actor}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      {entry.reason}
                    </p>

                    {entry.complianceRule && (
                      <div className="text-[10px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono mt-1 font-semibold">
                        Rule: {entry.complianceRule}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Razorpay AI Revenue Recovery Engine • Visa/Mastercard Bounded Execution</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
