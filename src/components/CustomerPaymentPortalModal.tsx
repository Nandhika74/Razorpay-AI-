import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecoveryCase } from '../types';

interface CustomerPaymentPortalModalProps {
  caseItem: RecoveryCase | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (caseId: string) => Promise<void>;
}

export const CustomerPaymentPortalModal: React.FC<CustomerPaymentPortalModalProps> = ({
  caseItem,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen || !caseItem) return null;

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(caseItem.status === 'RECOVERED');
  const [newCardNumber, setNewCardNumber] = useState('4111 2222 3333 4444');
  const [upiId, setUpiId] = useState(`${caseItem.customer.phone.replace(/[^0-9]/g, '').slice(-10)}@okaxis`);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(caseItem.id);
      setIsSuccess(true);
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="customer-payment-portal-backdrop" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="customer-payment-portal-card" className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Razorpay Brand & Mandate Banner */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl transition-colors hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Razorpay Secure Mandate Checkout</span>
          </div>

          <div className="flex items-baseline justify-between mt-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{caseItem.customer.planName}</h2>
              <p className="text-xs text-slate-300 font-normal mt-0.5">Recurring Mandate • {caseItem.customer.name}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black tracking-tight">₹{caseItem.customer.amountINR.toLocaleString('en-IN')}</span>
              <span className="block text-[10px] text-slate-300 font-medium">Auto-Debit Renewal</span>
            </div>
          </div>
        </div>

        {/* Notice of Previous Decline */}
        <div className="bg-amber-50 px-5 py-3 border-b border-amber-200/70 flex items-center space-x-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold">Prior debit attempt declined:</span>{' '}
            <span className="font-medium text-amber-800">{caseItem.failureEvent.decline.reason}</span>
            <span className="block text-[10px] text-amber-700 mt-0.5">Authorize this payment or update your payment method to restore recurring subscription access.</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Payment Successfully Authorized!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} captured via Razorpay. Your recurring subscription mandate has been re-certified with zero downtime.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Select Payment Method */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Select Payment / Mandate Instrument:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      selectedMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    <span>UPI AutoPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      selectedMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>Cards (Update)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('netbanking')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      selectedMethod === 'netbanking'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <span>Netbanking</span>
                  </button>
                </div>
              </div>

              {/* Instrument Details */}
              {selectedMethod === 'upi' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">1-Click UPI AutoPay ID</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      RBI e-Mandate Compliant
                    </span>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                  <p className="text-[10.5px] text-slate-400">
                    A notification prompt will be dispatched directly to your Google Pay / PhonePe app.
                  </p>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Card Replacement Instrument</span>
                    <span className="text-[10px] text-slate-500 font-mono">Previous: {caseItem.customer.cardNetwork} •••• {caseItem.customer.cardLast4}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">New Card Number</label>
                    <input
                      type="text"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Expiry</label>
                      <input
                        type="text"
                        defaultValue="12/29"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CVV</label>
                      <input
                        type="password"
                        defaultValue="123"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'netbanking' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800">Popular Banks</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 font-bold text-indigo-900 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>HDFC Bank</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>ICICI Bank</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-customer-authorize-mandate"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-200 transition-colors disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Contacting Issuer & Securing e-Mandate...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Pay ₹{caseItem.customer.amountINR.toLocaleString('en-IN')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mt-2.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>256-bit SSL Encrypted • PCI-DSS Level 1 Compliant • RBI Mandate Certified</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
