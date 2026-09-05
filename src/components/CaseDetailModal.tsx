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
  Crown,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecoveryCase } from '../types';
import { CustomerPaymentPortalModal } from './CustomerPaymentPortalModal';

interface CaseDetailModalProps {
  caseItem: RecoveryCase | null;
  onClose: () => void;
  onExecuteAction: (caseId: string, actionType: string, customNote?: string) => Promise<void>;
  onGenerateAIOutreach: (caseId: string, channel: string, language: string) => Promise<void>;
  isLoadingAction: boolean;
  priorityRank?: number;
}

const getAvatarStyle = (name: string) => {
  const palettes = [
    { bg: 'from-indigo-600 to-blue-700', text: 'text-white', ring: 'ring-indigo-200' },
    { bg: 'from-purple-600 to-indigo-700', text: 'text-white', ring: 'ring-purple-200' },
    { bg: 'from-emerald-600 to-teal-700', text: 'text-white', ring: 'ring-emerald-200' },
    { bg: 'from-amber-600 to-orange-700', text: 'text-white', ring: 'ring-amber-200' },
    { bg: 'from-cyan-600 to-blue-600', text: 'text-white', ring: 'ring-cyan-200' },
    { bg: 'from-rose-600 to-pink-700', text: 'text-white', ring: 'ring-rose-200' },
  ];
  const charCode = name ? name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0) : 0;
  return palettes[charCode % palettes.length];
};

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onExecuteAction,
  onGenerateAIOutreach,
  isLoadingAction,
  priorityRank = 1,
}) => {
  if (!caseItem) return null;

  const [activeTab, setActiveTab] = useState<'decision_tree' | 'ai_outreach' | 'audit_trail'>('decision_tree');
  const [outreachChannel, setOutreachChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [outreachLanguage, setOutreachLanguage] = useState<'english' | 'hindi' | 'hinglish'>(
    caseItem.customer.preferredLanguage || 'english'
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<'customer' | 'custom'>('customer');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);

  // Automatically synchronize tone & language to customer's registered preference whenever caseItem changes
  React.useEffect(() => {
    if (caseItem?.customer?.preferredLanguage) {
      setOutreachLanguage(caseItem.customer.preferredLanguage);
    } else {
      setOutreachLanguage('english');
    }
  }, [caseItem?.id, caseItem?.customer?.preferredLanguage]);

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

  // Authentic language templates matching user preferences
  const defaultHindiBody = isHardDecline
    ? `नमस्ते ${caseItem.customer.name},\n\nआपकी ${caseItem.customer.planName} सदस्यता (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) का नवीनीकरण पूरा नहीं हो पाया क्योंकि आपके बैंक द्वारा कार्ड निष्क्रिय रिपोर्ट किया गया है।\n\nअपनी सेवा को बिना किसी रुकावट के जारी रखने के लिए, कृपया नीचे दिए गए सुरक्षित 1-क्लिक लिंक से नया भुगतान माध्यम जोड़ें:\n\n👉 https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}\n\nहमारी सहायता टीम 24x7 उपलब्ध है। - Team Razorpay Support`
    : `नमस्ते ${caseItem.customer.name}! 🙏\n\nआपकी ${caseItem.customer.planName} सदस्यता (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) का स्वतः भुगतान बैंक प्रमाणीकरण (${caseItem.failureEvent.decline.reason}) के कारण पूरा नहीं हो पाया।\n\nअपनी सेवा को बिना किसी रुकावट के जारी रखने के लिए, कृपया नीचे दिए गए सुरक्षित 1-क्लिक लिंक से भुगतान विधि अपडेट करें:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nकिसी भी सहायता के लिए आप इस संदेश का उत्तर दे सकते हैं। - Team Razorpay Support`;

  const defaultHinglishBody = isHardDecline
    ? `Namaste ${caseItem.customer.name}! 👋\n\nAapka ${caseItem.customer.planName} subscription (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) card issuer ke inactive report ki wajah se pause ho gaya hai.\n\nBina kisi interruption ke access continue rakhne ke liye, please neeche diye link se 1-click me replacement card set karein:\n\n👉 https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}\n\nTeam Razorpay Support`
    : `Namaste ${caseItem.customer.name}! 👋\n\nAapka ${caseItem.customer.planName} subscription (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) ka payment bank processing glitch ki wajah se complete nahi ho paya.\n\nAapki service bina kisi interruption ke continuous rahe, iske liye please neeche diye link se 1-click me payment refresh ya card update karein:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nKoi help chahiye ho toh reply karein. Team Razorpay Support`;

  const defaultEnglishBody = isHardDecline
    ? `Hi ${caseItem.customer.name},\n\nWe noticed your recurring subscription payment for ${caseItem.customer.planName} (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) was halted because the payment card on file has been reported inactive/cancelled by your issuing bank.\n\nTo keep your access uninterrupted, please set up a replacement payment method here:\n\n👉 https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}\n\nOur support team is also on standby to assist you directly.`
    : `Hi ${caseItem.customer.name},\n\nYour recurring subscription payment for ${caseItem.customer.planName} (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) couldn't be processed due to a temporary bank authorization notice (${caseItem.failureEvent.decline.reason}).\n\nTo ensure your service remains uninterrupted, please refresh your payment method via this secure 1-click link:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nNeed assistance? Reply to this message anytime. - Team Razorpay Support`;

  // Dynamic message body that automatically adapts to the selected/preferred language immediately
  const currentMessageBody =
    (caseItem.outreachDraft && caseItem.outreachDraft.language === outreachLanguage)
      ? caseItem.outreachDraft.messageBody
      : (outreachLanguage === 'hindi'
        ? defaultHindiBody
        : outreachLanguage === 'hinglish'
        ? defaultHinglishBody
        : defaultEnglishBody);

  const activeTargetPhone = recipientMode === 'custom' && customPhone ? customPhone : caseItem.customer.phone;
  const activeTargetEmail = recipientMode === 'custom' && customEmail ? customEmail : caseItem.customer.email;
  
  // Intelligent Phone Normalization: If 10 digits (like 9994791779), prepend India country code 91!
  let cleanPhoneDigits = activeTargetPhone.replace(/[^0-9]/g, '');
  if (cleanPhoneDigits.length === 10) {
    cleanPhoneDigits = `91${cleanPhoneDigits}`;
  }

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(currentMessageBody)}`;
  const mailtoUrl = `mailto:${activeTargetEmail}?subject=${encodeURIComponent(`Payment Notice: ${caseItem.customer.planName} Subscription (₹${caseItem.customer.amountINR})`)}&body=${encodeURIComponent(currentMessageBody)}`;

  const handleSimulateDispatch = async () => {
    const actionToTake = caseItem.status === 'RECOVERED' ? 'TEST_DISPATCH' : 'DISPATCH_COMMUNICATION';
    const destination = outreachChannel === 'email' ? activeTargetEmail : activeTargetPhone;
    const note = `Dispatched via ${outreachChannel.toUpperCase()} (${outreachLanguage}) to ${destination}`;
    
    await handleAction(actionToTake, note);
    setDispatchStatus(`Message dispatched to ${destination} via ${outreachChannel.toUpperCase()} Gateway at ${new Date().toLocaleTimeString()} [Receipt #ACK-${Math.floor(100000 + Math.random() * 900000)}]`);
  };

  return (
    <div id="case-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="case-detail-modal" className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Stylized Dynamic Avatar */}
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarStyle(caseItem.customer.name).bg} text-white flex items-center justify-center font-black text-lg shadow-sm ring-2 ${getAvatarStyle(caseItem.customer.name).ring}`}>
                {caseItem.customer.name.charAt(0)}
              </div>
              {(caseItem.customer.tenureMonths >= 12 || caseItem.customer.riskTier === 'low_risk_vip') && (
                <div 
                  title="VIP Customer (Loyal Subscriber)"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                >
                  <Crown className="w-3 h-3 text-amber-900" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900 text-lg">{caseItem.customer.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  #{caseItem.id}
                </span>

                {/* Queue Rank Badge */}
                <span className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold border flex items-center gap-1 ${
                  priorityRank === 1 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                  priorityRank <= 3 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <span>Rank #{priorityRank}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">in queue</span>
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                  {caseItem.batchSplit === 'held_out' ? 'Held-Out Split' : 'Design Split'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                <span className="text-slate-600 font-semibold">{caseItem.customer.email}</span>
                <span>•</span>
                <span>{caseItem.customer.phone}</span>
                <span>•</span>
                <span className="text-slate-800 font-bold">{caseItem.customer.planName} (₹{caseItem.customer.amountINR.toLocaleString('en-IN')})</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 text-[11px]">
                  {Math.round(caseItem.customer.historicalSuccessRate * 100)}% Baseline Reliability
                </span>
              </div>
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
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Surprise Index:</span>
                        <span className={`font-bold ${caseItem.diagnosis.isAnomalousBlip ? 'text-amber-700' : 'text-slate-700'}`}>
                          {Math.round(caseItem.diagnosis.surpriseScore * 100)}% {caseItem.diagnosis.isAnomalousBlip ? '(Isolated Blip)' : '(Chronic Friction)'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                        {caseItem.classification.isHardDecline ? (
                          <span className="text-rose-600 font-semibold">0.0 (Hard Decline Override)</span>
                        ) : (
                          <span>
                            {caseItem.customer.historicalSuccessRate.toFixed(2)} × min({caseItem.customer.tenureMonths}/12, 1) × (1 - {Math.max(0, caseItem.customer.totalHistoricalPayments - caseItem.customer.successfulHistoricalPayments)}/10) = <strong className="text-slate-700">{caseItem.diagnosis.surpriseScore.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
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
                  <p className="text-[11px] text-slate-600 font-medium">
                    {isHardDecline ? (
                      'Terminal 0% (Hard Decline Lock)'
                    ) : caseItem.classification.zone === 'RETRY_SOON' ? (
                      `${caseItem.diagnosis.isAnomalousBlip ? '92% (Blip Base)' : '78% (Gateway Base)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    ) : caseItem.classification.zone === 'RETRY_LATER' ? (
                      `${caseItem.diagnosis.isAnomalousBlip ? '84% (Blip Base)' : '58% (Liquidity Base)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    ) : (
                      `${caseItem.customer.tenureMonths > 6 ? '74% (Tenured)' : '62% (New)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Zone Baseline + Risk Tier Modifier</p>
                </div>

                {/* Priority Rank & Triage Score */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Queue Priority Rank & Triage Score
                  </span>
                  
                  {/* Big Rank Badge + Composite Score */}
                  <div className="flex items-center justify-center gap-2 my-1">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-xl font-mono text-2xl font-black border ${
                      priorityRank === 1 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      priorityRank <= 3 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      #{priorityRank}
                    </span>
                    <span className="text-xl font-bold text-slate-400">
                      ({caseItem.trendScore.recoveryPriorityScore} pts)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 font-semibold">
                    ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} · {Math.min(60, Math.round((caseItem.customer.amountINR / 8000) * 60))}pts Value + {caseItem.classification.isHardDecline ? 0 : Math.min(40, Math.round((14 - Math.max(1, caseItem.trendScore.daysRemainingInDunning)) * (40 / 13)))}pts Urgency
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Queue order = Revenue at Stake × Likelihood ({caseItem.trendScore.recoveryLikelihoodPct}%) × Urgency
                  </p>
                </div>

                {/* Network Compliance Meter */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {caseItem.compliance.network} 30D Limit*
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
                  <p className="text-[9.5px] text-slate-400 italic mt-1 leading-tight">
                    *Per published network merchant guidelines
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 block">Tone & Language:</label>
                      {caseItem.customer.preferredLanguage && (
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                          Customer Registered Preference: {caseItem.customer.preferredLanguage === 'hindi' ? 'हिंदी (Hindi)' : caseItem.customer.preferredLanguage === 'hinglish' ? 'Hinglish' : 'English'} (Auto-Selected)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setOutreachLanguage('english')}
                        className={`py-2 px-3 rounded-xl border text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                          outreachLanguage === 'english'
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                        }`}
                      >
                        <span>English (Professional)</span>
                        {caseItem.customer.preferredLanguage === 'english' && (
                          <span className={`text-[9px] ${outreachLanguage === 'english' ? 'text-indigo-300' : 'text-indigo-600 font-bold'}`}>
                            Customer Default
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setOutreachLanguage('hindi')}
                        className={`py-2 px-3 rounded-xl border text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                          outreachLanguage === 'hindi'
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                        }`}
                      >
                        <span>हिंदी (Hindi)</span>
                        {caseItem.customer.preferredLanguage === 'hindi' && (
                          <span className={`text-[9px] ${outreachLanguage === 'hindi' ? 'text-indigo-300' : 'text-indigo-600 font-bold'}`}>
                            Customer Default
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setOutreachLanguage('hinglish')}
                        className={`py-2 px-3 rounded-xl border text-xs transition-all flex flex-col items-center justify-center gap-0.5 ${
                          outreachLanguage === 'hinglish'
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                        }`}
                      >
                        <span>Hinglish (Conversational)</span>
                        {caseItem.customer.preferredLanguage === 'hinglish' && (
                          <span className={`text-[9px] ${outreachLanguage === 'hinglish' ? 'text-indigo-300' : 'text-indigo-600 font-bold'}`}>
                            Customer Default
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipient Target Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>Target Recipient Information</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {recipientMode === 'customer' 
                          ? `Default subscription contact on file for ${caseItem.customer.name}` 
                          : 'Enter your personal phone number or email to receive and test the real message'}
                      </p>
                    </div>
                    <div className="flex space-x-1.5 bg-slate-200/80 p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => setRecipientMode('customer')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                          recipientMode === 'customer'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Customer on File
                      </button>
                      <button
                        onClick={() => setRecipientMode('custom')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                          recipientMode === 'custom'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Test My Own Contact
                      </button>
                    </div>
                  </div>

                  {recipientMode === 'customer' ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Customer Phone:</span>
                            <span className="font-mono font-bold text-slate-800 text-xs">{caseItem.customer.phone}</span>
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Email Address:</span>
                            <span className="font-mono font-bold text-slate-800 text-xs">{caseItem.customer.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl px-3 py-2 text-[11px] text-blue-800 leading-relaxed">
                        <span className="font-bold">Sandbox Note:</span> Phone <code className="font-mono font-bold bg-white px-1 py-0.5 rounded text-blue-900">{caseItem.customer.phone}</code> is synthetic test data. To send to your real WhatsApp without error, click <strong className="underline cursor-pointer" onClick={() => setRecipientMode('custom')}>"Test My Own Contact"</strong> above.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Your Mobile / WhatsApp Number:</label>
                          <input
                            type="text"
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            placeholder="e.g. 9994791779 or +91 99947 91779"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Your Email Address:</label>
                          <input
                            type="email"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      {cleanPhoneDigits && (
                        <div className="text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between">
                          <span>✓ Auto-formatted WhatsApp Target: <strong>+{cleanPhoneDigits}</strong></span>
                          <span className="text-[10px] text-emerald-600">Pre-validated with country code</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Body Preview */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Synthesized Contextual Message:</span>
                    <button
                      onClick={() => copyToClipboard(currentMessageBody)}
                      className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                    {currentMessageBody}
                  </div>

                  {/* Contextual Action Bar based on chosen Target Channel */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    {outreachChannel === 'whatsapp' && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        <span>Send via WhatsApp (+{cleanPhoneDigits})</span>
                        <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                      </a>
                    )}

                    {outreachChannel === 'email' && (
                      <a
                        href={mailtoUrl}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-1.5" />
                        <span>Send via Email Client ({activeTargetEmail})</span>
                        <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                      </a>
                    )}

                    {outreachChannel === 'sms' && (
                      <button
                        onClick={() => copyToClipboard(currentMessageBody)}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 transition-colors"
                      >
                        <Smartphone className="w-4 h-4 mr-1.5" />
                        <span>Copy SMS Notice Body</span>
                      </button>
                    )}

                    {/* Single unified Test Customer Mandate Checkout Portal button */}
                    <button
                      type="button"
                      id="btn-test-customer-portal"
                      onClick={() => setIsCustomerPortalOpen(true)}
                      className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
                      title="Open interactive Razorpay customer checkout portal to test 1-click recovery"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      <span>Test Customer Payment Portal</span>
                    </button>

                    {/* Simulated Gateway Dispatch */}
                    <button
                      onClick={handleSimulateDispatch}
                      disabled={isLoadingAction}
                      className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm shadow-slate-300 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>Simulate Gateway Webhook</span>
                    </button>
                  </div>

                  {/* Dispatch Confirmation Banner & Simulation */}
                  {dispatchStatus && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2.5 animate-in fade-in">
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-950">Outreach Transmission Confirmed</p>
                          <p className="text-[11px] text-emerald-800 mt-0.5">{dispatchStatus}</p>
                        </div>
                      </div>

                      {caseItem.status !== 'RECOVERED' && (
                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-emerald-800 font-medium">
                            Test customer response: Customer taps link and confirms card renewal?
                          </span>
                          <button
                            onClick={() => handleAction('SIMULATE_CUSTOMER_PAY')}
                            disabled={isLoadingAction}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] shadow-xs transition-colors shrink-0"
                          >
                            Simulate Customer 1-Click Pay
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Interactive Customer Mandate Checkout Portal Modal */}
      <CustomerPaymentPortalModal
        caseItem={caseItem}
        isOpen={isCustomerPortalOpen}
        onClose={() => setIsCustomerPortalOpen(false)}
        onConfirmPayment={async (caseId) => {
          await handleAction('SIMULATE_CUSTOMER_PAY', 'Customer authorized 1-click mandate recovery via Razorpay portal');
        }}
      />
    </div>
  );
};
