import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronRight, ShieldCheck, AlertCircle, CheckCircle, Clock, XOctagon, UserCheck } from 'lucide-react';
import { RecoveryCase, ZoneClassification, CaseStatus } from '../types';

interface CaseTableProps {
  cases: RecoveryCase[];
  onSelectCase: (caseItem: RecoveryCase) => void;
  selectedCaseId?: string;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onSelectCase,
  selectedCaseId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'amount' | 'likelihood' | 'tenure'>('priority');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.failureEvent.decline.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesZone = zoneFilter === 'ALL' || c.classification.zone === zoneFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'priority') return b.trendScore.recoveryPriorityScore - a.trendScore.recoveryPriorityScore;
    if (sortBy === 'amount') return b.customer.amountINR - a.customer.amountINR;
    if (sortBy === 'likelihood') return b.trendScore.recoveryLikelihoodPct - a.trendScore.recoveryLikelihoodPct;
    if (sortBy === 'tenure') return b.customer.tenureMonths - a.customer.tenureMonths;
    return 0;
  });

  const getZoneBadge = (zone: ZoneClassification) => {
    switch (zone) {
      case 'NEVER_RETRY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">Never Retry (Hard)</span>;
      case 'RETRY_SOON':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">Retry Soon (Gateway)</span>;
      case 'RETRY_LATER':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">Retry Later (Funds)</span>;
      case 'NEEDS_ACTION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">Needs Action (Auth)</span>;
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'RECOVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Recovered
          </span>
        );
      case 'EXCLUDED_HARD_DECLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Hard Stop
          </span>
        );
      case 'ACTIVE_DUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Active
          </span>
        );
      case 'ACTION_REQUIRED_SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Outreach
          </span>
        );
      case 'HANDED_OFF_CEILING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Ceiling CS
          </span>
        );
    }
  };

  return (
    <div id="case-table-container" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Controls & Filters */}
      <div className="p-5 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-case-search"
            type="text"
            placeholder="Search by customer, plan, case ID, error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Zone Filter */}
          <select
            id="select-zone-filter"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Zones</option>
            <option value="NEVER_RETRY">Never Retry (Hard)</option>
            <option value="RETRY_SOON">Retry Soon (Gateway)</option>
            <option value="RETRY_LATER">Retry Later (Funds)</option>
            <option value="NEEDS_ACTION">Needs Action (Auth)</option>
          </select>

          {/* Status Filter */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="RECOVERED">Recovered</option>
            <option value="ACTIVE_DUNNING">Active Dunning</option>
            <option value="ACTION_REQUIRED_SENT">Outreach Sent</option>
            <option value="EXCLUDED_HARD_DECLINE">Excluded (Hard Stop)</option>
            <option value="HANDED_OFF_CEILING">Ceiling Handoff</option>
          </select>

          {/* Sort By */}
          <select
            id="select-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="priority">Sort: Priority Rank (High → Low)</option>
            <option value="amount">Sort: Amount (₹ High → Low)</option>
            <option value="likelihood">Sort: Recovery Likelihood %</option>
            <option value="tenure">Sort: Customer Tenure</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="py-3.5 px-5">Customer / Case</th>
              <th className="py-3.5 px-4">Amount & Plan</th>
              <th className="py-3.5 px-4">Decline Signal</th>
              <th className="py-3.5 px-4">Stage 2 Zone</th>
              <th className="py-3.5 px-4 text-center">Likelihood</th>
              <th className="py-3.5 px-4 text-center">Priority</th>
              <th className="py-3.5 px-4 text-center">Compliance</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  No cases found matching the current search / filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                return (
                  <tr
                    key={c.id}
                    id={`case-row-${c.id}`}
                    onClick={() => onSelectCase(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Customer */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs uppercase border border-slate-200">
                          {c.customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center space-x-2">
                            <span>{c.customer.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
                              {c.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {c.customer.tenureMonths}m tenure • {Math.round(c.customer.historicalSuccessRate * 100)}% baseline
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount & Plan */}
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-800">
                        ₹{c.customer.amountINR.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={c.customer.planName}>
                        {c.customer.planName}
                      </div>
                    </td>

                    {/* Decline Reason */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-700 truncate max-w-[170px]" title={c.failureEvent.decline.reason}>
                        {c.failureEvent.decline.reason}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono">{c.customer.cardNetwork} •••• {c.customer.cardLast4}</span>
                        {c.diagnosis.isAnomalousBlip && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px]">
                            Blip
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getZoneBadge(c.classification.zone)}
                    </td>

                    {/* Likelihood */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-bold ${
                          c.trendScore.recoveryLikelihoodPct >= 80 ? 'text-emerald-600' :
                          c.trendScore.recoveryLikelihoodPct >= 50 ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {c.trendScore.recoveryLikelihoodPct}%
                        </span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${c.trendScore.recoveryLikelihoodPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Priority Score */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                        c.trendScore.recoveryPriorityScore >= 75 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        c.trendScore.recoveryPriorityScore >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.trendScore.recoveryPriorityScore}
                      </span>
                    </td>

                    {/* Compliance */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {c.compliance.attemptCount}/{c.compliance.maxAllowedAttempts}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.compliance.isCeilingReached ? 'Ceiling Stop' : `${c.compliance.attemptsRemaining} left`}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        id={`btn-triage-${c.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shadow-2xs"
                      >
                        <span>Triage</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
