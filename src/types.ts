export type CardNetwork = 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'UPI_AutoPay';

export type ZoneClassification = 'NEVER_RETRY' | 'RETRY_SOON' | 'RETRY_LATER' | 'NEEDS_ACTION';

export type CaseStatus = 
  | 'RECOVERED'
  | 'ACTIVE_DUNNING'
  | 'ACTION_REQUIRED_SENT'
  | 'EXCLUDED_HARD_DECLINE'
  | 'HANDED_OFF_CEILING';

export type ActionChannel = 
  | 'SILENT_NETWORK_RETRY'
  | 'WHATSAPP_INTERACTIVE'
  | 'EMAIL_DUNNING'
  | 'SMS_LINK'
  | 'HUMAN_ESCALATION';

export interface RazorpayDeclineInfo {
  code: string;
  source: 'customer' | 'bank' | 'gateway' | 'network';
  step: 'payment_authorization' | 'payment_authentication' | 'mandate_execution' | 'card_verification';
  reason: string;
  description: string;
  httpStatusCode?: number;
  rawGatewayResponse?: string;
  isTestMode?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  planName: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  amountINR: number;
  currency: 'INR';
  cardNetwork: CardNetwork;
  cardLast4: string;
  cardExpiry: string;
  mandateId: string;
  tenureMonths: number;
  totalHistoricalPayments: number;
  successfulHistoricalPayments: number;
  historicalSuccessRate: number; // 0.0 to 1.0
  lastSuccessDate: string;
  typicalSalaryDay: number; // e.g. 1st or 30th of month
  riskTier: 'low_risk_vip' | 'stable' | 'moderate' | 'high_churn_risk';
}

export interface Stage1Diagnosis {
  rawDeclineReason: string;
  customerBaselineRate: number;
  tenureContext: string;
  surpriseScore: number; // 0.0 (totally expected) to 1.0 (highly anomalous blip)
  isAnomalousBlip: boolean;
  explanation: string;
}

export interface Stage2Classification {
  zone: ZoneClassification;
  isHardDecline: boolean;
  recommendedAction: string;
  recommendedWaitHours: number;
  stopReason?: string;
  taxonomyNotes: string;
}

export interface Stage3TrendScore {
  trendSlope: 'positive' | 'flat' | 'decaying';
  recoveryLikelihoodPct: number; // 0 to 100
  recoveryPriorityScore: number; // 0 to 100
  valueAtRiskINR: number;
  daysRemainingInDunning: number;
  urgencyMultiplier: number;
  reasoning: string;
}

export interface Stage4ExecutionCompliance {
  network: CardNetwork;
  attemptCount: number;
  maxAllowedAttempts: number; // 15 for Visa, 10 for Mastercard, 12 for RuPay
  attemptsRemaining: number;
  isCeilingReached: boolean;
  macStopCodeTriggered?: 'MAC_03' | 'MAC_21' | 'NONE';
  nextAllowedRetryDate: string | null;
  recommendedChannel: ActionChannel;
  complianceRuleApplied: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  stage: 1 | 2 | 3 | 4 | 5;
  stageName: string;
  action: string;
  resultStatus: string;
  reason: string;
  complianceRule?: string;
  details?: Record<string, any>;
  actor: 'AI_AGENT' | 'NETWORK_RULE_ENGINE' | 'WEBHOOK_RECEIVER' | 'CUSTOMER_ACTION' | 'CS_ESCALATION';
}

export interface AIOutreachDraft {
  channel: 'whatsapp' | 'email' | 'sms';
  language: 'english' | 'hinglish';
  subject?: string;
  messageBody: string;
  callToActionUrl: string;
  generatedAt: string;
  personalizedReasoning: string;
}

export interface RecoveryCase {
  id: string;
  batchSplit: 'design' | 'held_out' | 'live_demo';
  customer: CustomerProfile;
  failureEvent: {
    paymentId: string;
    subscriptionId: string;
    timestamp: string;
    decline: RazorpayDeclineInfo;
    attemptNumber: number;
  };
  currentStage: 1 | 2 | 3 | 4 | 5;
  diagnosis: Stage1Diagnosis;
  classification: Stage2Classification;
  trendScore: Stage3TrendScore;
  compliance: Stage4ExecutionCompliance;
  status: CaseStatus;
  recoveryMethod?: string;
  recoveredAt?: string;
  recoveredAmountINR?: number;
  hoursToRecovery?: number;
  outreachDraft?: AIOutreachDraft;
  auditTrail: AuditEntry[];
}

export interface BatchEvaluationMetrics {
  split: 'design' | 'held_out' | 'live_demo' | 'all';
  totalCases: number;
  totalAtRiskINR: number;
  totalRecoveredINR: number;
  recoveryRatePct: number;
  hardDeclinesCompliantlyStopped: number;
  networkCeilingsRespected: number;
  complianceViolationsCount: number;
  preventedFinesINR: number;
  avgAttemptsPerRecovery: number;
  avgHoursToRecovery: number;
  netRevenueSavedINR: number;
}

export interface RazorpayConfigState {
  hasKeyId: boolean;
  hasKeySecret: boolean;
  hasWebhookSecret: boolean;
  hasGeminiKey: boolean;
  keyIdMasked: string;
  mode: 'live_sandbox' | 'synthetic_replay';
  appUrl: string;
}

export interface TestCardPreset {
  id: string;
  name: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  network: CardNetwork;
  expectedErrorCode: string;
  expectedZone: ZoneClassification;
  description: string;
}
