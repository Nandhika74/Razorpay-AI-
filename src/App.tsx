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

  return (
    <div id="root-app-container" className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        config={config}
        selectedSplit={selectedSplit}
        onSelectSplit={setSelectedSplit}
        onOpenSandboxLab={() => setIsSandboxLabOpen(true)}
        onOpenHeldOutLedger={() => setIsHeldOutLedgerOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
        totalCaseCount={cases.length}
        liveDemoCount={liveDemoCount}
      />

      {/* Main Content Dashboard */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 flex-1 space-y-6">
        {/* KPI Metrics */}
        <MetricsOverview metrics={activeMetrics} selectedSplit={selectedSplit} />

        {/* 4-Stage Architecture Flow Visualizer */}
        <PipelineStageFlow />

        {/* Case Table Explorer */}
        <CaseTable
          cases={displayedCases}
          onSelectCase={(c) => setSelectedCase(c)}
          selectedCaseId={selectedCase?.id}
        />
      </main>

      {/* Modals & Drawers */}
      <CaseDetailModal
        caseItem={selectedCase}
        onClose={() => setSelectedCase(null)}
        onExecuteAction={handleExecuteAction}
        onGenerateAIOutreach={handleGenerateAIOutreach}
        isLoadingAction={isActionLoading}
      />

      <RazorpaySandboxLab
        isOpen={isSandboxLabOpen}
        onClose={() => setIsSandboxLabOpen(false)}
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
