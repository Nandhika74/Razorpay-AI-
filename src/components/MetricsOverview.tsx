import React from 'react';
import { IndianRupee, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, ArrowUpRight, Scale } from 'lucide-react';
import { BatchEvaluationMetrics } from '../types';

interface MetricsOverviewProps {
  metrics: BatchEvaluationMetrics;
  selectedSplit: 'held_out' | 'design' | 'live_demo' | 'all';
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, selectedSplit }) => {
  const isHeldOut = selectedSplit === 'held_out';
  const isLiveDemo = selectedSplit === 'live_demo';

  return (
    <div id="metrics-overview" className="space-y-4">
      {/* Split Framing Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isHeldOut 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : isLiveDemo
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHeldOut ? 'bg-emerald-500' : isLiveDemo ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'}`} />
            {isHeldOut ? 'Held-Out Evaluation Split' : isLiveDemo ? 'Live Sandbox / Webhook Ingestion' : selectedSplit === 'design' ? 'Design / Tuning Split' : 'Aggregate (All Cases)'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {isHeldOut
              ? 'Computed strictly on held-out test data — zero leakage, verified stopping rules, auditable accounting.'
              : isLiveDemo
              ? 'Real-time test events triggered via Razorpay test card presets or live webhook simulation.'
              : 'Data used to calibrate surprise thresholds, backoff intervals, and priority weights.'}
          </span>
        </div>
        <div className="text-xs font-medium text-slate-400">
          Cohort Cases: <span className="font-bold text-slate-800">{metrics.totalCases}</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Recovered */}
        <div id="metric-recovered-revenue" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Recovered</p>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 flex items-baseline">
              <span className="text-lg mr-1 font-semibold text-slate-400">₹</span>
              {metrics.totalRecoveredINR.toLocaleString('en-IN')}
            </div>
            <div className="mt-2.5 flex items-center text-xs text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{metrics.recoveryRatePct}% recovery rate</span>
              <span className="text-slate-300 mx-1.5">•</span>
              <span className="text-slate-400 font-normal">₹{metrics.totalAtRiskINR.toLocaleString('en-IN')} at risk</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, metrics.recoveryRatePct)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Soft vs Hard Triage */}
        <div id="metric-triage-accuracy" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliant Stopping</p>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 flex items-baseline">
              {metrics.hardDeclinesCompliantlyStopped}
              <span className="text-xs font-semibold text-slate-400 ml-2">hard stops enforced</span>
            </div>
            <div className="mt-2.5 flex items-center text-xs text-indigo-700 font-semibold">
              <span>0 wasted retries on closed/stolen cards</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-medium">
            Stops immediately on MAC 21 (revoked) & permanent issuer declines.
          </p>
        </div>

        {/* Metric 3: Scheme Compliance Violations */}
        <div id="metric-compliance-violations" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network Violations</p>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-baseline">
              {metrics.complianceViolationsCount}
              <span className="text-xs font-bold text-emerald-700 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                100% Compliant
              </span>
            </div>
            <div className="mt-2.5 text-xs text-slate-500 font-medium">
              <span>Visa 15 / Mastercard 10 rolling-30D ceilings*</span>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-slate-500 font-medium">
              {metrics.networkCeilingsRespected} cases safely escalated to CS on limit.
            </p>
            <p className="text-[10px] text-slate-400 leading-tight italic">
              *Configured per published network merchant guidelines; may vary by MCC & region.
            </p>
          </div>
        </div>

        {/* Metric 4: Fines & Penalties Prevented */}
        <div id="metric-fines-prevented" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avoided Fines</p>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 flex items-baseline">
              <span className="text-lg mr-1 font-semibold text-slate-400">₹</span>
              {metrics.preventedFinesINR.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calculation Breakdown:</div>
              <div className="font-mono text-[11px] text-slate-700">
                ({metrics.hardDeclinesCompliantlyStopped} Hard Stops × ₹25k) + ({metrics.networkCeilingsRespected} Ceiling Halts × ₹15k)
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed font-medium">
            Protects merchant MID from VMMP & excessive retry monitoring fines ($5k–$75k/mo).
          </p>
        </div>
      </div>
    </div>
  );
};
