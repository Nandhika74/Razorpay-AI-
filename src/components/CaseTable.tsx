import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XOctagon, 
  UserCheck, 
  Crown, 
  HelpCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { RecoveryCase, ZoneClassification, CaseStatus } from '../types';

interface CaseTableProps {
  cases: RecoveryCase[];
  onSelectCase: (caseItem: RecoveryCase) => void;
  selectedCaseId?: string;
}

// Deterministic avatar gradient generator
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

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  onSelectCase,
  selectedCaseId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'amount' | 'likelihood' | 'tenure'>('priority');

  // Compute global priority rank (#1, #2, #3...) across all cases based on recoveryPriorityScore
  const priorityRankMap = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
      // First sort by recovery priority score descending
      if (b.trendScore.recoveryPriorityScore !== a.trendScore.recoveryPriorityScore) {
        return b.trendScore.recoveryPriorityScore - a.trendScore.recoveryPriorityScore;
      }
      // Tie breaker: invoice amount
      return b.customer.amountINR - a.customer.amountINR;
    });
    const map = new Map<string, number>();
    sorted.forEach((item, index) => {
      map.set(item.id, index + 1);
    });
    return map;
  }, [cases]);

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
    if (sortBy === 'priority') {
      const rankA = priorityRankMap.get(a.id) || 999;
      const rankB = priorityRankMap.get(b.id) || 999;
      return rankA - rankB; // #1 before #2
    }
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
            <option value="priority">Sort: Priority Rank (#1 → Top)</option>
            <option value="amount">Sort: Amount (₹ High → Low)</option>
            <option value="likelihood">Sort: Recovery Likelihood %</option>
            <option value="tenure">Sort: Customer Tenure</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="py-3.5 px-5 whitespace-nowrap">Customer / Profile</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Amount & Plan</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Decline Signal</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Stage 2 Zone</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">
                <div className="inline-flex items-center space-x-1">
                  <span>Likelihood</span>
                  <span className="text-[9px] font-normal text-slate-400 lowercase">(prob)</span>
                </div>
              </th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">
                <div className="inline-flex items-center space-x-1" title="Ordinal Queue Rank (#1, #2...) based on composite recovery triage score">
                  <span>Priority Rank</span>
                  <span className="text-[9px] font-normal text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-mono font-bold">#</span>
                </div>
              </th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Compliance</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
              <th className="py-3.5 px-5 text-right whitespace-nowrap">Action</th>
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
                const avatarStyle = getAvatarStyle(c.customer.name);
                const rank = priorityRankMap.get(c.id) || 1;
                const isVip = c.customer.tenureMonths >= 12 || c.customer.riskTier === 'low_risk_vip';
                const isHighReliability = c.customer.historicalSuccessRate >= 0.90;

                return (
                  <tr
                    key={c.id}
                    id={`case-row-${c.id}`}
                    onClick={() => onSelectCase(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Elevated Customer Profile Presentation */}
                    <td className="py-4 px-5">
                      <div className="flex items-start space-x-3.5">
                        {/* Dynamic Stylized Avatar with VIP indicator */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-black text-xs uppercase shadow-sm shadow-slate-200 ring-2 ${avatarStyle.ring}`}>
                            {c.customer.name.charAt(0)}
                          </div>
                          {isVip && (
                            <div 
                              title="Loyal VIP Subscriber (12+ Months or High Baseline)" 
                              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border border-white rounded-full flex items-center justify-center shadow-xs"
                            >
                              <Crown className="w-2.5 h-2.5 text-amber-900" />
                            </div>
                          )}
                        </div>

                        {/* Customer Details & Micro-Chips */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs tracking-tight">
                              {c.customer.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                              #{c.id}
                            </span>
                          </div>

                          {/* Email snippet */}
                          <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                            {c.customer.email}
                          </div>

                          {/* High-craft metadata chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100/80 border border-slate-200/80 px-1.5 py-0.5 rounded">
                              <Clock className="w-2.5 h-2.5 mr-1 text-slate-400" />
                              {c.customer.tenureMonths}m tenure
                            </span>

                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              isHighReliability 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' 
                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                              <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                              {Math.round(c.customer.historicalSuccessRate * 100)}% baseline
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount & Plan */}
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-800 text-[13px]">
                        ₹{c.customer.amountINR.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]" title={c.customer.planName}>
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

                    {/* Likelihood (% Probability of Recovery) */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-black text-xs ${
                          c.trendScore.recoveryLikelihoodPct >= 80 ? 'text-emerald-600' :
                          c.trendScore.recoveryLikelihoodPct >= 50 ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {c.trendScore.recoveryLikelihoodPct}%
                        </span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              c.trendScore.recoveryLikelihoodPct >= 80 ? 'bg-emerald-500' :
                              c.trendScore.recoveryLikelihoodPct >= 50 ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                            style={{ width: `${c.trendScore.recoveryLikelihoodPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Priority Rank (#1, #2, #3...) with Score underneath */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span 
                          title={`Priority Rank #${rank} (Score: ${c.trendScore.recoveryPriorityScore}/100 based on ₹${c.customer.amountINR} value, urgency & tenure)`}
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black border transition-transform ${
                            rank === 1 ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-mono font-black scale-105' :
                            rank === 2 || rank === 3 ? 'bg-indigo-50 text-indigo-800 border-indigo-200 font-mono font-black' :
                            rank <= 10 ? 'bg-slate-100 text-slate-800 border-slate-200 font-mono' :
                            'bg-slate-50 text-slate-500 border-slate-200 font-mono'
                          }`}
                        >
                          #{rank}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                          {c.trendScore.recoveryPriorityScore} pts
                        </span>
                      </div>
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
