import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { PipelineStageFlow } from './components/PipelineStageFlow';
import { CaseTable } from './components/CaseTable';
import { CaseDetailModal } from './components/CaseDetailModal';
import { RazorpaySandboxLab } from './components/RazorpaySandboxLab';
import { HeldOutLedgerView } from './components/HeldOutLedgerView';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { RecoveryCase, BatchEvaluationMetrics, RazorpayConfigState } from './types';
import { FlaskConical, ChevronDown, ChevronUp, Cpu, ShieldCheck } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<RazorpayConfigState | null>(null);
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [metrics, setMetrics] = useState<{
    heldOut: BatchEvaluationMetrics;
    design: BatchEvaluationMetrics;
    liveDemo: BatchEvaluationMetrics;
    all: BatchEvaluationMetrics;
  }>({
    heldOut: {
      split: 'held_out',
      totalCases: 0,
      totalAtRiskINR: 0,
      totalRecoveredINR: 0,
      recoveryRatePct: 0,
      hardDeclinesCompliantlyStopped: 0,
      networkCeilingsRespected: 0,
      complianceViolationsCount: 0,
      preventedFinesINR: 0,
      avgAttemptsPerRecovery: 0,
      avgHoursToRecovery: 0,
      netRevenueSavedINR: 0,
    },
    design: {
      split: 'design',
      totalCases: 0,
      totalAtRiskINR: 0,
      totalRecoveredINR: 0,
      recoveryRatePct: 0,
      hardDeclinesCompliantlyStopped: 0,
      networkCeilingsRespected: 0,
      complianceViolationsCount: 0,
      preventedFinesINR: 0,
      avgAttemptsPerRecovery: 0,
      avgHoursToRecovery: 0,
      netRevenueSavedINR: 0,
    },
    liveDemo: {
      split: 'live_demo',
      totalCases: 0,
      totalAtRiskINR: 0,
      totalRecoveredINR: 0,
      recoveryRatePct: 0,
      hardDeclinesCompliantlyStopped: 0,
      networkCeilingsRespected: 0,
      complianceViolationsCount: 0,
      preventedFinesINR: 0,
      avgAttemptsPerRecovery: 0,
      avgHoursToRecovery: 0,
      netRevenueSavedINR: 0,
    },
    all: {
      split: 'all',
      totalCases: 0,
      totalAtRiskINR: 0,
      totalRecoveredINR: 0,
      recoveryRatePct: 0,
      hardDeclinesCompliantlyStopped: 0,
      networkCeilingsRespected: 0,
      complianceViolationsCount: 0,
      preventedFinesINR: 0,
      avgAttemptsPerRecovery: 0,
      avgHoursToRecovery: 0,
      netRevenueSavedINR: 0,
    },
  });

  const [activeTab, setActiveTab] = useState<'operations' | 'audit_ledger' | 'architecture' | 'sandbox_lab'>('operations');
  const [isPipelineFlowExpanded, setIsPipelineFlowExpanded] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<'held_out' | 'design' | 'live_demo' | 'all'>('held_out');
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);

  const [isSandboxLabOpen, setIsSandboxLabOpen] = useState(false);
  const [isHeldOutLedgerOpen, setIsHeldOutLedgerOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTriggeringTestCard, setIsTriggeringTestCard] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchData = async () => {
    try {
      const [configRes, casesRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/cases'),
      ]);
      const configData = await configRes.json();
      const casesData = await casesRes.json();

      setConfig(configData);
      setCases(casesData.cases || []);
      if (casesData.metrics) {
        setMetrics(casesData.metrics);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteAction = async (caseId: string, actionType: string, customNote?: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, customNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action rejected by scheme compliance rules');
      }
      if (data.case) {
        setCases((prev) => prev.map((c) => (c.id === caseId ? data.case : c)));
        setSelectedCase(data.case);
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      console.error('Error executing action:', err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateAIOutreach = async (caseId: string, channel: string, language: string) => {
    try {
      const res = await fetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, channel, language }),
      });
      const data = await res.json();
      if (data.draft && selectedCase) {
        const updated = { ...selectedCase, outreachDraft: data.draft };
        setSelectedCase(updated);
        setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      }
    } catch (err) {
      console.error('Error generating AI outreach:', err);
    }
  };

  const handleTriggerTestCard = async (
    testCardId: string,
    customerName: string,
    amountINR: number,
    cardNetwork: string
  ) => {
    setIsTriggeringTestCard(true);
    try {
      const res = await fetch('/api/razorpay/test-card-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCardId, customerName, amountINR, cardNetwork }),
      });
      const data = await res.json();
      if (data.case) {
        setCases((prev) => [data.case, ...prev]);
        setSelectedCase(data.case);
        // Switch to live_demo tab so the user sees their live action immediately!
        setSelectedSplit('live_demo');
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error triggering test card:', err);
    } finally {
      setIsTriggeringTestCard(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/cases/reset', { method: 'POST' });
      const data = await res.json();
      await fetchData();
      setSelectedCase(null);
    } catch (err) {
      console.error('Error resetting batch:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const displayedCases = selectedSplit === 'all'
    ? cases
    : cases.filter((c) => c.batchSplit === selectedSplit);

  const activeMetrics = selectedSplit === 'held_out'
    ? metrics.heldOut
    : selectedSplit === 'design'
    ? metrics.design
    : selectedSplit === 'live_demo'
    ? metrics.liveDemo
    : metrics.all;

  const liveDemoCount = cases.filter((c) => c.batchSplit === 'live_demo').length;

  // Compute selected case global priority rank (#1, #2, #3...) based on recoveryPriorityScore
  const selectedCasePriorityRank = React.useMemo(() => {
    if (!selectedCase) return 1;
    const sorted = [...cases].sort((a, b) => {
      if (b.trendScore.recoveryPriorityScore !== a.trendScore.recoveryPriorityScore) {
        return b.trendScore.recoveryPriorityScore - a.trendScore.recoveryPriorityScore;
      }
      return b.customer.amountINR - a.customer.amountINR;
    });
    const idx = sorted.findIndex((c) => c.id === selectedCase.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [cases, selectedCase]);

  return (
    <div id="root-app-container" className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Clean Header */}
      <Header
        config={config}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedSplit={selectedSplit}
        onSelectSplit={setSelectedSplit}
        onResetData={handleResetData}
        isResetting={isResetting}
        totalCaseCount={cases.length}
        liveDemoCount={liveDemoCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Tab 1: Recovery Operations Worklist */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            {/* View Header with Context & Fast Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1 gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <span>Subscription Recovery Queue</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {displayedCases.length} cases
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Autonomous 4-stage bounded execution engine for recurring Razorpay mandates
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-switch-to-sandbox"
                  onClick={() => setActiveTab('sandbox_lab')}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  <span>Simulate Decline in Sandbox</span>
                </button>
              </div>
            </div>

            {/* KPI Metrics */}
            <MetricsOverview metrics={activeMetrics} selectedSplit={selectedSplit} />

            {/* Clean Collapsible 4-Stage Pipeline Summary Strip */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                    4S
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">4-Stage Bounded Recovery Engine</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Scheme Bound
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Stage 1: Context Diagnosis → Stage 2: Zone Classification → Stage 3: Dual-Score Triage → Stage 4: Bounded Execution
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="btn-toggle-pipeline-flow"
                    onClick={() => setIsPipelineFlowExpanded(!isPipelineFlowExpanded)}
                    className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    {isPipelineFlowExpanded ? (
                      <>
                        <span>Hide Flow Diagram</span>
                        <ChevronUp className="w-3.5 h-3.5 ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Inspect Flow Diagram</span>
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                  <button
                    id="btn-goto-architecture-specs"
                    onClick={() => setActiveTab('architecture')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Full Specs →
                  </button>
                </div>
              </div>

              {isPipelineFlowExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <PipelineStageFlow />
                </div>
              )}
            </div>

            {/* Case Table Explorer */}
            <CaseTable
              cases={displayedCases}
              onSelectCase={(c) => setSelectedCase(c)}
              selectedCaseId={selectedCase?.id}
            />
          </div>
        )}

        {/* Tab 2: Audit & Evaluation Ledger */}
        {activeTab === 'audit_ledger' && (
          <div className="space-y-6">
            <HeldOutLedgerView
              inline={true}
              metrics={metrics}
              cases={cases}
              onBackToQueue={() => setActiveTab('operations')}
              onClose={() => setActiveTab('operations')}
            />
          </div>
        )}

        {/* Tab 3: Pipeline Architecture & Specs */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <PipelineStageFlow />
            <ArchitectureDocsModal
              inline={true}
              onBackToQueue={() => setActiveTab('operations')}
              onClose={() => setActiveTab('operations')}
            />
          </div>
        )}

        {/* Tab 4: Sandbox Test Lab */}
        {activeTab === 'sandbox_lab' && (
          <div className="space-y-6">
            <RazorpaySandboxLab
              inline={true}
              config={config}
              onBackToQueue={() => setActiveTab('operations')}
              onClose={() => setActiveTab('operations')}
              onTriggerTestCard={handleTriggerTestCard}
              isTriggering={isTriggeringTestCard}
            />
          </div>
        )}
      </main>

      {/* Case Details Slide-over / Modal */}
      <CaseDetailModal
        caseItem={selectedCase}
        priorityRank={selectedCasePriorityRank}
        onClose={() => setSelectedCase(null)}
        onExecuteAction={handleExecuteAction}
        onGenerateAIOutreach={handleGenerateAIOutreach}
        isLoadingAction={isActionLoading}
      />

      {/* Fallback Modals (if opened from external triggers) */}
      <RazorpaySandboxLab
        isOpen={isSandboxLabOpen}
        onClose={() => setIsSandboxLabOpen(false)}
        onBackToQueue={() => setIsSandboxLabOpen(false)}
        config={config}
        onTriggerTestCard={handleTriggerTestCard}
        isTriggering={isTriggeringTestCard}
      />

      <HeldOutLedgerView
        isOpen={isHeldOutLedgerOpen}
        onClose={() => setIsHeldOutLedgerOpen(false)}
        metrics={metrics}
        cases={cases}
      />

      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
