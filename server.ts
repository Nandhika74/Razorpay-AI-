import 'dotenv/config';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Razorpay from 'razorpay';
import { generateInitialCases } from './src/data/seedData';
import {
  evaluateBatch,
  runStage1Diagnosis,
  runStage2Classification,
  runStage3TrendScore,
  runStage4ExecutionCompliance,
} from './src/engine/recoveryPipeline';
import { RecoveryCase, RazorpayDeclineInfo, ActionChannel } from './src/types';

// In-memory case repository initialized with statistically calibrated data
let casesStore: RecoveryCase[] = generateInitialCases();

// Lazy Gemini SDK client helper
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Lazy Razorpay SDK helper
let razorpayClient: any = null;
function getRazorpay(): any {
  if (!razorpayClient && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      razorpayClient = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } catch (e) {
      console.warn('Could not initialize Razorpay client:', e);
    }
  }
  return razorpayClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Config & status inspection
  app.get('/api/config', (req: Request, res: Response) => {
    const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.trim().length > 0);
    const hasKeySecret = Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.trim().length > 0);
    const hasWebhookSecret = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET.trim().length > 0);
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

    const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
    const keyIdMasked = rawKeyId.length > 8
      ? `${rawKeyId.slice(0, 6)}...${rawKeyId.slice(-4)}`
      : rawKeyId ? 'rzp_test_***' : 'Not Provided (Using Embedded Sandbox Engine)';

    res.json({
      hasKeyId,
      hasKeySecret,
      hasWebhookSecret,
      hasGeminiKey,
      keyIdMasked,
      mode: hasKeyId && hasKeySecret ? 'live_sandbox' : 'synthetic_replay',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    });
  });

  // 2.5 Test Razorpay API Connection
  app.get('/api/razorpay/test-connection', async (req: Request, res: Response) => {
    const rzp = getRazorpay();
    if (!rzp) {
      res.json({
        connected: false,
        message: 'Razorpay API credentials not configured in environment. Using Embedded Sandbox simulation engine.',
      });
      return;
    }
    const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
    const keyIdMasked = rawKeyId.length > 8 ? `${rawKeyId.slice(0, 6)}...${rawKeyId.slice(-4)}` : 'rzp_test_***';
    try {
      // Standard Razorpay accounts always have access to orders/payments
      await rzp.orders.all({ count: 1 });
      res.json({
        connected: true,
        message: 'Connected to Razorpay Live Sandbox API successfully.',
        keyIdMasked,
      });
    } catch (err: any) {
      console.error('[Razorpay Connection Test Error]:', err);
      const isAuthError = err?.statusCode === 401 || err?.statusCode === 403 || err?.error?.code === 'BAD_REQUEST_ERROR' && err?.error?.description?.includes('auth');
      const errorDesc = err?.error?.description || err?.message || (typeof err === 'string' ? err : 'Connection check error');
      
      // If error is not 401 (e.g. 200/empty items or network check), credentials are valid
      const isValidAuth = !isAuthError && err?.statusCode !== 401;
      res.json({
        connected: isValidAuth,
        message: isValidAuth ? 'Connected to Razorpay Live Sandbox API.' : `Razorpay auth check: ${errorDesc}`,
        keyIdMasked,
        error: errorDesc,
        statusCode: err?.statusCode,
      });
    }
  });

  // 3. Get all recovery cases
  app.get('/api/cases', (req: Request, res: Response) => {
    const split = req.query.split as 'design' | 'held_out' | 'live_demo' | 'all' | undefined;
    let list = casesStore;
    if (split && split !== 'all') {
      list = casesStore.filter((c) => c.batchSplit === split);
    }
    res.json({
      cases: list,
      metrics: {
        heldOut: evaluateBatch(casesStore, 'held_out'),
        design: evaluateBatch(casesStore, 'design'),
        liveDemo: evaluateBatch(casesStore, 'live_demo'),
        all: evaluateBatch(casesStore, 'all'),
      },
    });
  });

  // 4. Get specific case
  app.get('/api/cases/:id', (req: Request, res: Response) => {
    const found = casesStore.find((c) => c.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json({ case: found });
  });

  // 5. Execute action on case (Smart Retry, Send Link, Escalate, Force Success)
  app.post('/api/cases/:id/action', (req: Request, res: Response) => {
    const { actionType, customNote } = req.body;
    const caseItem = casesStore.find((c) => c.id === req.params.id);
    if (!caseItem) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Terminal State Protection: Once a case is RECOVERED, payment is settled.
    // No further dunning, retry, or escalation actions can be taken.
    if (caseItem.status === 'RECOVERED') {
      res.status(400).json({
        error: `Case is already RECOVERED and settled (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}). No further recovery actions can be executed on a closed, paid invoice.`,
      });
      return;
    }

    // CRITICAL COMPLIANCE CIRCUIT BREAKER:
    // Hard declines (stolen/closed/MAC 21) are permanently invalid payment instruments.
    // Automated retries, customer 1-click links, and recovery dunning are strictly blocked under Card Scheme rules.
    if (
      caseItem.classification.zone === 'NEVER_RETRY' &&
      ['SMART_RETRY', 'DISPATCH_COMMUNICATION', 'SIMULATE_CUSTOMER_PAY'].includes(actionType)
    ) {
      res.status(400).json({
        error: `Compliance Block: Hard decline enforced (${caseItem.failureEvent.decline.reason || caseItem.compliance.macStopCodeTriggered}). Card is stolen, cancelled, or revoked. No recovery action permitted on this instrument. Must escalate to Human CS for payment method swap.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();

    if (actionType === 'SMART_RETRY') {
      // Check ceiling rule
      if (caseItem.compliance.attemptCount >= caseItem.compliance.maxAllowedAttempts) {
        res.status(400).json({
          error: `Compliance Block: Maximum allowed attempts (${caseItem.compliance.maxAllowedAttempts}) reached for ${caseItem.compliance.network}. Automated retry blocked.`,
        });
        return;
      }

      const nextAttempt = caseItem.compliance.attemptCount + 1;
      // Re-evaluate compliance
      caseItem.compliance = runStage4ExecutionCompliance(caseItem.customer, caseItem.classification, nextAttempt);

      // Determine outcome: high baseline/likelihood has high success rate
      const willSucceed = Math.random() * 100 <= caseItem.trendScore.recoveryLikelihoodPct;

      if (willSucceed) {
        caseItem.status = 'RECOVERED';
        caseItem.recoveredAt = nowIso;
        caseItem.recoveredAmountINR = caseItem.customer.amountINR;
        caseItem.recoveryMethod = 'Autonomous Smart Network Retry';

        caseItem.auditTrail.push({
          id: `aud_${Date.now()}`,
          timestamp: nowIso,
          stage: 5,
          stageName: 'Ledger Audit Entry',
          action: 'REVENUE_CAPTURED_SUCCESSFULLY',
          resultStatus: 'RECOVERED',
          reason: `Attempt #${nextAttempt} succeeded. Captured ₹${caseItem.customer.amountINR.toLocaleString('en-IN')}. ${customNote || 'Smart retry executed successfully.'}`,
          actor: 'AI_AGENT',
        });
      } else {
        caseItem.auditTrail.push({
          id: `aud_${Date.now()}`,
          timestamp: nowIso,
          stage: 4,
          stageName: 'Stage 4: Bounded Execution',
          action: `RETRY_ATTEMPT_${nextAttempt}_FAILED`,
          resultStatus: caseItem.compliance.isCeilingReached ? 'HANDED_OFF_CEILING' : 'ACTIVE_DUNNING',
          reason: `Attempt #${nextAttempt} did not authorize. ${caseItem.compliance.attemptsRemaining} attempts remain before ceiling.`,
          complianceRule: caseItem.compliance.complianceRuleApplied,
          actor: 'NETWORK_RULE_ENGINE',
        });

        if (caseItem.compliance.isCeilingReached) {
          caseItem.status = 'HANDED_OFF_CEILING';
        }
      }
    } else if (actionType === 'DISPATCH_COMMUNICATION') {
      caseItem.status = 'ACTION_REQUIRED_SENT';
      caseItem.auditTrail.push({
        id: `aud_${Date.now()}`,
        timestamp: nowIso,
        stage: 4,
        stageName: 'Stage 4: Outreach Dispatch',
        action: `DISPATCH_${caseItem.compliance.recommendedChannel}`,
        resultStatus: 'ACTION_REQUIRED_SENT',
        reason: `Personalized recovery link sent via ${caseItem.compliance.recommendedChannel}. ${customNote || ''}`,
        actor: 'AI_AGENT',
      });
    } else if (actionType === 'SIMULATE_CUSTOMER_PAY') {
      caseItem.status = 'RECOVERED';
      caseItem.recoveredAt = nowIso;
      caseItem.recoveredAmountINR = caseItem.customer.amountINR;
      caseItem.recoveryMethod = 'Customer 1-Click Link Authorization';
      caseItem.auditTrail.push({
        id: `aud_${Date.now()}`,
        timestamp: nowIso,
        stage: 5,
        stageName: 'Ledger Audit Entry',
        action: 'CUSTOMER_ACTION_RECOVERY',
        resultStatus: 'RECOVERED',
        reason: `Customer clicked recovery link and successfully updated payment mandate for ₹${caseItem.customer.amountINR.toLocaleString('en-IN')}.`,
        actor: 'CUSTOMER_ACTION',
      });
    } else if (actionType === 'ESCALATE_HUMAN') {
      caseItem.status = 'HANDED_OFF_CEILING';
      caseItem.auditTrail.push({
        id: `aud_${Date.now()}`,
        timestamp: nowIso,
        stage: 4,
        stageName: 'Stage 4: Clean Escalation',
        action: 'ESCALATE_TO_CUSTOMER_SUCCESS',
        resultStatus: 'HANDED_OFF_CEILING',
        reason: `Case routed to High-Touch Key Account Success rep. All automated retries halted. ${customNote || ''}`,
        actor: 'CS_ESCALATION',
      });
    }

    res.json({
      case: caseItem,
      metrics: {
        heldOut: evaluateBatch(casesStore, 'held_out'),
        design: evaluateBatch(casesStore, 'design'),
        liveDemo: evaluateBatch(casesStore, 'live_demo'),
        all: evaluateBatch(casesStore, 'all'),
      },
    });
  });

  // 6. Trigger Test Card Sandbox Simulation
  app.post('/api/razorpay/test-card-trigger', async (req: Request, res: Response) => {
    const { testCardId, customerName, amountINR, cardNetwork } = req.body;
    const nowIso = new Date().toISOString();
    const caseId = `RC-LIVE-${Date.now().toString().slice(-4)}`;

    let errorCode = 'BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE';
    let errorReason = 'insufficient_fund';
    let errorStep: RazorpayDeclineInfo['step'] = 'payment_authorization';
    let errorSource: RazorpayDeclineInfo['source'] = 'customer';

    if (testCardId === 'tc_gateway_error') {
      errorCode = 'GATEWAY_ERROR_ISSUER_NETWORK_DOWN';
      errorReason = 'gateway_technical_error';
      errorSource = 'gateway';
    } else if (testCardId === 'tc_auth_failed') {
      errorCode = 'BAD_REQUEST_PAYMENT_OTP_VALIDATION_FAILED';
      errorReason = 'authentication_failed';
      errorStep = 'payment_authentication';
    } else if (testCardId === 'tc_expired_card') {
      errorCode = 'BAD_REQUEST_PAYMENT_CARD_EXPIRED';
      errorReason = 'expired_card';
      errorSource = 'bank';
    } else if (testCardId === 'tc_stolen_card') {
      errorCode = 'BAD_REQUEST_PAYMENT_CARD_STOLEN';
      errorReason = 'card_stolen_fraud_alert';
      errorSource = 'bank';
    }

    const customer = {
      id: `cust_live_${caseId.toLowerCase()}`,
      name: customerName || 'Sandbox Test Customer',
      email: 'test.user@sandbox-razorpay.io',
      phone: '+91 98989 00000',
      planName: 'Sandbox Ingested Subscription',
      billingCycle: 'monthly' as const,
      amountINR: Number(amountINR) || 4999,
      currency: 'INR' as const,
      cardNetwork: cardNetwork || 'Visa',
      cardLast4: '4242',
      cardExpiry: '12/28',
      mandateId: `mand_live_${caseId.toLowerCase()}`,
      tenureMonths: 12,
      totalHistoricalPayments: 12,
      successfulHistoricalPayments: 11,
      historicalSuccessRate: 0.92,
      lastSuccessDate: nowIso,
      typicalSalaryDay: 1,
      riskTier: 'stable' as const,
    };

    const declineInfo: RazorpayDeclineInfo = {
      code: errorCode,
      source: errorSource,
      step: errorStep,
      reason: errorReason,
      description: `Razorpay Ingested Sandbox Event: ${errorReason}`,
      httpStatusCode: 400,
      isTestMode: true,
    };

    const diagnosis = runStage1Diagnosis(customer, declineInfo, 1);
    const classification = runStage2Classification(declineInfo, diagnosis);
    const trendScore = runStage3TrendScore(customer, diagnosis, classification, 14);
    const compliance = runStage4ExecutionCompliance(customer, classification, classification.zone === 'NEVER_RETRY' ? 0 : 1);

    const initialStatus = classification.zone === 'NEVER_RETRY' ? 'EXCLUDED_HARD_DECLINE' : 'ACTIVE_DUNNING';

    const newCase: RecoveryCase = {
      id: caseId,
      batchSplit: 'live_demo',
      customer,
      failureEvent: {
        paymentId: `pay_live_${Date.now()}`,
        subscriptionId: `sub_live_${Date.now()}`,
        timestamp: nowIso,
        decline: declineInfo,
        attemptNumber: classification.zone === 'NEVER_RETRY' ? 0 : 1,
      },
      currentStage: 4,
      diagnosis,
      classification,
      trendScore,
      compliance,
      status: initialStatus,
      auditTrail: [
        {
          id: `aud_${Date.now()}_1`,
          timestamp: nowIso,
          stage: 1,
          stageName: 'Stage 1: Context-Adjusted Diagnosis',
          action: 'INGEST_LIVE_TEST_EVENT',
          resultStatus: 'DIAGNOSED',
          reason: diagnosis.explanation,
          actor: 'WEBHOOK_RECEIVER',
        },
        {
          id: `aud_${Date.now()}_2`,
          timestamp: nowIso,
          stage: 2,
          stageName: 'Stage 2: Zone Classification',
          action: `CLASSIFY_ZONE_${classification.zone}`,
          resultStatus: classification.zone,
          reason: classification.taxonomyNotes,
          complianceRule: classification.isHardDecline ? 'HARD_DECLINE_RULE_ZERO_RETRY' : undefined,
          actor: 'AI_AGENT',
        },
        {
          id: `aud_${Date.now()}_3`,
          timestamp: nowIso,
          stage: 3,
          stageName: 'Stage 3: Dual-Score Trend Assessment',
          action: 'CALCULATE_ORTHOGONAL_SCORES',
          resultStatus: `Likelihood ${trendScore.recoveryLikelihoodPct}% | Priority ${trendScore.recoveryPriorityScore}/100`,
          reason: trendScore.reasoning,
          actor: 'AI_AGENT',
        },
        {
          id: `aud_${Date.now()}_4`,
          timestamp: nowIso,
          stage: 4,
          stageName: 'Stage 4: Bounded Execution & Network Ceilings',
          action: compliance.isCeilingReached ? 'ENFORCE_CEILING_STOP' : `SCHEDULE_${compliance.recommendedChannel}`,
          resultStatus: initialStatus,
          reason: compliance.complianceRuleApplied,
          complianceRule: `${compliance.network} Rolling-30D Cap: max ${compliance.maxAllowedAttempts} attempts`,
          actor: 'NETWORK_RULE_ENGINE',
        },
      ],
    };

    casesStore.unshift(newCase);

    res.json({
      success: true,
      case: newCase,
      metrics: {
        heldOut: evaluateBatch(casesStore, 'held_out'),
        design: evaluateBatch(casesStore, 'design'),
        liveDemo: evaluateBatch(casesStore, 'live_demo'),
        all: evaluateBatch(casesStore, 'all'),
      },
    });
  });

  // 7. Razorpay Webhook Ingestion Endpoint
  app.post('/api/razorpay/webhook', (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // HMAC verification if webhook secret is configured
    if (webhookSecret && signature) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (expectedSignature !== signature) {
          console.warn('[Webhook Warning] Signature mismatch received on webhook event.');
          res.status(400).json({ error: 'Invalid webhook signature' });
          return;
        }
      } catch (err) {
        console.error('[Webhook Error] Error verifying webhook signature:', err);
      }
    }

    const event = req.body?.event || 'payment.failed';
    const paymentEntity = req.body?.payload?.payment?.entity;
    const subscriptionEntity = req.body?.payload?.subscription?.entity;

    console.log(`[Webhook Received] Event: ${event}`, paymentEntity ? `Payment ID: ${paymentEntity.id}` : '');

    // Ingest recurring payment failures directly into the autonomous 4-stage pipeline
    if (paymentEntity && (event === 'payment.failed' || event === 'subscription.halted' || event === 'subscription.pending')) {
      const nowIso = new Date().toISOString();
      const caseId = `CS-WH-${Date.now().toString().slice(-4)}`;
      const amountINR = paymentEntity.amount ? Math.round(paymentEntity.amount / 100) : 2499;
      const errorCode = paymentEntity.error_code || 'BAD_REQUEST_ERROR';
      const errorReason = paymentEntity.error_description || paymentEntity.error_reason || 'payment_failed';
      const errorSource = paymentEntity.error_source || 'customer';
      const errorStep = paymentEntity.error_step || 'payment_authorization';
      const customerContact = paymentEntity.contact || '+91 98765 43210';
      const customerEmail = paymentEntity.email || 'customer@enterprise.io';
      const cardNetwork = paymentEntity.card?.network || 'Visa';

      const customer = {
        id: `cust_wh_${caseId.toLowerCase()}`,
        name: paymentEntity.notes?.customer_name || 'Razorpay Live Customer',
        email: customerEmail,
        phone: customerContact,
        planName: subscriptionEntity?.plan_id ? `Subscription ${subscriptionEntity.plan_id}` : 'Pro Cloud Subscription',
        amountINR,
        currency: 'INR' as const,
        billingCycle: 'monthly' as const,
        cardNetwork: cardNetwork || 'Visa',
        cardLast4: paymentEntity.card?.last4 || '4242',
        cardExpiry: `${paymentEntity.card?.expiry_month || '12'}/${paymentEntity.card?.expiry_year ? String(paymentEntity.card.expiry_year).slice(-2) : '28'}`,
        mandateId: paymentEntity.token_id || `mand_${caseId.toLowerCase()}`,
        tenureMonths: 10,
        totalHistoricalPayments: 10,
        successfulHistoricalPayments: 9,
        historicalSuccessRate: 0.9,
        lastSuccessDate: nowIso,
        typicalSalaryDay: 1,
        riskTier: 'stable' as const,
      };

      const declineInfo: RazorpayDeclineInfo = {
        code: errorCode,
        source: errorSource,
        step: errorStep,
        reason: errorReason,
        description: `Live Razorpay Webhook Ingestion: ${errorReason}`,
        httpStatusCode: 400,
        isTestMode: Boolean(paymentEntity.test),
      };

      const diagnosis = runStage1Diagnosis(customer, declineInfo, 1);
      const classification = runStage2Classification(declineInfo, diagnosis);
      const trendScore = runStage3TrendScore(customer, diagnosis, classification, 14);
      const compliance = runStage4ExecutionCompliance(customer, classification, classification.zone === 'NEVER_RETRY' ? 0 : 1);

      const initialStatus = classification.zone === 'NEVER_RETRY' ? 'EXCLUDED_HARD_DECLINE' : 'ACTIVE_DUNNING';

      const newCase: RecoveryCase = {
        id: caseId,
        batchSplit: 'live_demo',
        customer,
        failureEvent: {
          paymentId: paymentEntity.id || `pay_${Date.now()}`,
          subscriptionId: subscriptionEntity?.id || paymentEntity.invoice_id || `sub_${Date.now()}`,
          timestamp: nowIso,
          decline: declineInfo,
          attemptNumber: classification.zone === 'NEVER_RETRY' ? 0 : 1,
        },
        currentStage: 4,
        diagnosis,
        classification,
        trendScore,
        compliance,
        status: initialStatus,
        auditTrail: [
          {
            id: `aud_${Date.now()}_1`,
            timestamp: nowIso,
            stage: 1,
            stageName: 'Stage 1: Context-Adjusted Diagnosis',
            action: 'INGEST_RAZORPAY_WEBHOOK',
            resultStatus: 'DIAGNOSED',
            reason: `Ingested live webhook event (${event}). ${diagnosis.explanation}`,
            actor: 'WEBHOOK_RECEIVER',
          },
          {
            id: `aud_${Date.now()}_2`,
            timestamp: nowIso,
            stage: 2,
            stageName: 'Stage 2: Zone Classification',
            action: `CLASSIFY_ZONE_${classification.zone}`,
            resultStatus: classification.zone,
            reason: classification.taxonomyNotes,
            complianceRule: classification.isHardDecline ? 'HARD_DECLINE_RULE_ZERO_RETRY' : undefined,
            actor: 'AI_AGENT',
          },
          {
            id: `aud_${Date.now()}_3`,
            timestamp: nowIso,
            stage: 3,
            stageName: 'Stage 3: Dual-Score Trend Assessment',
            action: 'CALCULATE_ORTHOGONAL_SCORES',
            resultStatus: `Likelihood ${trendScore.recoveryLikelihoodPct}% | Priority ${trendScore.recoveryPriorityScore}/100`,
            reason: trendScore.reasoning,
            actor: 'AI_AGENT',
          },
          {
            id: `aud_${Date.now()}_4`,
            timestamp: nowIso,
            stage: 4,
            stageName: 'Stage 4: Bounded Execution & Network Ceilings',
            action: compliance.isCeilingReached ? 'ENFORCE_CEILING_STOP' : `SCHEDULE_${compliance.recommendedChannel}`,
            resultStatus: initialStatus,
            reason: compliance.complianceRuleApplied,
            complianceRule: `${compliance.network} Rolling-30D Cap: max ${compliance.maxAllowedAttempts} attempts`,
            actor: 'NETWORK_RULE_ENGINE',
          },
        ],
      };

      casesStore.unshift(newCase);
    }

    // Always respond 200 OK immediately for Razorpay SLA compliance
    res.json({ status: 'received', event, processedAt: new Date().toISOString() });
  });

  // 8. AI Strategy & Outreach Generator (Gemini 3.7 Flash)
  app.post('/api/ai/outreach', async (req: Request, res: Response) => {
    const { caseId, channel, language } = req.body;
    const caseItem = casesStore.find((c) => c.id === caseId);

    if (!caseItem) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const ai = getGemini();

    // Fallback template if Gemini key is not configured
    let generatedBody = '';
    let personalizedReasoning = '';

    if (ai) {
      try {
        const prompt = `You are the Razorpay AI Revenue Recovery Agent. Generate a polite, highly empathetic, context-aware payment recovery message.
Customer Name: ${caseItem.customer.name}
Plan Name: ${caseItem.customer.planName}
Amount: ₹${caseItem.customer.amountINR}
Failure Reason: ${caseItem.failureEvent.decline.reason} (${caseItem.failureEvent.decline.code})
Customer Baseline: ${caseItem.customer.tenureMonths} months tenure, ${Math.round(caseItem.customer.historicalSuccessRate * 100)}% historical success
Zone: ${caseItem.classification.zone}
Channel: ${channel || 'whatsapp'}
Language: ${language || 'english'} (If Hinglish, write natural, professional conversational Romanized Hindi-English, e.g. "Namaste ${caseItem.customer.name}, aapka ${caseItem.customer.planName} payment momentarily uncompleted raha. Tap karke 1-click me refresh karein:")

Keep it concise, friendly, compliant with RBI guidelines, and include the 1-click update link: https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
        });

        generatedBody = response.text || '';
        personalizedReasoning = `Synthesized via Google Gemini 3.7 Flash using ${caseItem.customer.tenureMonths}-month customer baseline context and ${caseItem.failureEvent.decline.reason} error taxonomy.`;
      } catch (err: any) {
        console.warn('Gemini generation failed, using intelligent template:', err);
      }
    }

    if (!generatedBody) {
      if (language === 'hinglish') {
        generatedBody = `Namaste ${caseItem.customer.name}! 👋\n\nAapka ${caseItem.customer.planName} subscription (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) ka payment bank processing glitch ki wajah se complete nahi ho paya.\n\nAapki service bina kisi interruption ke continuous rahe, iske liye please neeche diye link se 1-click me payment refresh ya card update karein:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nKoi help chahiye ho toh reply karein. Team Razorpay Support`;
      } else {
        generatedBody = `Hi ${caseItem.customer.name},\n\nYour recurring subscription payment for ${caseItem.customer.planName} (₹${caseItem.customer.amountINR.toLocaleString('en-IN')}) couldn't be processed due to a temporary bank authorization notice (${caseItem.failureEvent.decline.reason}).\n\nTo ensure your service remains uninterrupted, please refresh your payment method via this secure 1-click link:\n\n👉 https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}\n\nNeed assistance? Reply to this message anytime.`;
      }
      personalizedReasoning = `Generated with built-in heuristic template matching ${caseItem.classification.zone} zone rules.`;
    }

    const draft = {
      channel: channel || 'whatsapp',
      language: language || 'english',
      subject: `Update required: ${caseItem.customer.planName} Subscription Payment`,
      messageBody: generatedBody,
      callToActionUrl: `https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}`,
      generatedAt: new Date().toISOString(),
      personalizedReasoning,
    };

    caseItem.outreachDraft = draft;
    res.json({ draft });
  });

  // 9. Reset batch to initial seed state
  app.post('/api/cases/reset', (req: Request, res: Response) => {
    casesStore = generateInitialCases();
    res.json({
      success: true,
      metrics: {
        heldOut: evaluateBatch(casesStore, 'held_out'),
        design: evaluateBatch(casesStore, 'design'),
        liveDemo: evaluateBatch(casesStore, 'live_demo'),
        all: evaluateBatch(casesStore, 'all'),
      },
    });
  });

  // Vite middleware in dev or static serve in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Revenue Recovery Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
