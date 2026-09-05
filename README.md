> **🎥 Demo Video:** [Watch the 5-minute walkthrough](https://youtu.be/T9qcoiiNrkQ)
# ⚡ PayPulse- Autonomous Subscription Recovery Agent
> **Track 03: Failed-Subscription Recovery Agent**  
> An intelligent, autonomous 4-stage decision engine and dunning orchestration pipeline for recovering failed recurring payments, e-mandates, and subscriptions while enforcing card scheme compliance.

---

## 📌 Executive Summary

Subscription businesses lose up to 9–15% of Monthly Recurring Revenue (MRR) to **involuntary churn** caused by failed recurring charges (insufficient funds, temporary gateway timeouts, 3DS authentication issues, and expired cards). Traditional dunning systems blindly retry transactions on arbitrary static schedules (e.g. every 24 hours), causing:
1. **Network Fines & Merchant Penalties**: Violating Visa & Mastercard strict rolling-30-day retry ceilings.
2. **Customer Relationship Degradation**: Aggressive automated emails sent to loyal VIP subscribers during temporary banking blips.
3. **Wasted Processing Fees**: Repeatedly attempting charges on hard-declined, stolen, or closed cards.

This project implements an **Autonomous Payment Recovery Agent** that diagnoses payment failures, dynamically classifies decline zones, prioritizes high-value salvageable revenue, enforces card network bounds, and synthesizes empathetic, 1-click recovery outreach powered by Google Gemini AI.

---

## 🏗️ Architecture & 4-Stage Decision Pipeline

```text
┌────────────────────────────────────────────────────────────┐
│              Razorpay Webhook: payment.failed              │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ STAGE 1: CONTEXT-ADJUSTED DIAGNOSIS                        │
│ • Extracts Razorpay Error Taxonomies                       │
│ • Ingests Customer Payment History & Tenure Baseline       │
│ • Computes Anomaly "Surprise Index" for VIP detection      │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ STAGE 2: 3-ZONE ACTION CLASSIFICATION                      │
│ • RETRY_SOON  : Transient gateway timeouts & dropouts      │
│ • RETRY_LATER : Soft balance declines on smart payday sync │
│ • NEVER_RETRY : Hard declines (stolen, closed, MAC 21)     │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ STAGE 3: DUAL-SCORE PRIORITIZATION                         │
│ • Orthogonal Scoring: Recovery Likelihood % vs Priority    │
│ • Weighted by Contract Value (MRR/ARR) & Urgency           │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ STAGE 4: BOUNDED EXECUTION & COMPLIANCE GUARD              │
│ • Visa Cap Guard: Max 15 attempts per rolling 30-day window│
│ • Mastercard Cap Guard: Max 10 attempts per 30-day window  │
│ • Zero-Retry Circuit Breaker on Hard Declines              │
└─────────────────────────────┬──────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Autonomous Retry Engine  │   │  Gemini AI Smart Outreach │
│    (Razorpay SDK / API)   │   │  (WhatsApp / SMS / Email) │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 📐 Mathematical Models & Formulas

### 1. The Customer "Surprise Index"
Quantifies whether a payment failure is an unexpected anomaly for a loyal customer or a chronic liquidity risk:

$$\text{Surprise Index} = \text{Historical Success Rate} \times \left(\frac{\min(\text{Tenure Months}, 12)}{12}\right) \times \left(1 - \frac{\text{Failures In Past Year}}{10}\right)$$

- **VIP Customer (Tenure: 18m, 0 failures)**: $1.0 \times 1.0 \times 1.0 = \mathbf{1.00}$ *(High protection, zero aggressive dunning)*
- **At-Risk / New Customer (Tenure: 2m, 3 failures)**: $0.50 \times \frac{2}{12} \times 0.70 = \mathbf{0.058}$ *(Low surprise, standard dunning queue)*

### 2. Recovery Likelihood Score (%)
The empirical predictive probability combines the decline reason's zone, customer surprise blip status, and risk tier:

$$\text{Likelihood (\%)} = \text{Zone Baseline (conditioned on Surprise Blip)} + \text{Risk Tier Modifier}$$

- **Zone Baselines**:
  - `RETRY_SOON` (Gateway / Switch Timeout): **92%** for Anomalous Blip ($\text{Surprise} \ge 0.70$), **78%** standard
  - `RETRY_LATER` (Balance / Liquidity): **84%** for Anomalous Blip ($\text{Surprise} \ge 0.70$), **58%** standard
  - `NEEDS_ACTION` (Expired Card / 3DS Auth): **74%** for tenured ($>6\text{m}$), **62%** for new customers
  - `NEVER_RETRY` (Stolen / Closed / MAC 21): **0%** terminal compliance lock
- **Risk Tier Modifiers**:
  - `low_risk_vip`: $+8\%$ boost (capped at $99\%$)
  - `high_churn_risk`: $-18\%$ penalty
- **Napkin Math Walkthrough (Aarav Sharma, RC-DES-101)**:
  - Error: `insufficient_fund` $\rightarrow$ Zone: `RETRY_LATER`
  - Customer: 18m tenure, 94% historic success $\rightarrow \text{Surprise Index} = 0.85 \ge 0.70$ (Anomalous Blip) $\rightarrow \text{Base} = 84\%$
  - Risk Segment: `low_risk_vip` $\rightarrow \text{Bonus} = +8\%$
  - $\mathbf{\text{Final Likelihood} = 84\% + 8\% = 92\%}$ *(reconciles exactly with code and UI)*

### 3. Recovery Priority Score
Determines the dynamic queue order (0–100 rank) to triage cases via an additive dual-factor formula:

$$\text{Priority Rank} = \min\left(100, \text{Normalized Value} + \text{Normalized Urgency}\right)$$

$$\text{Normalized Value (0--60 pts)} = \min\left(60, \frac{\text{Amount INR}}{8,000} \times 60\right)$$

$$\text{Normalized Urgency (0--40 pts)} = \min\left(40, (14 - \text{Safe Days Left}) \times \frac{40}{13}\right)$$

$$\text{Hard Decline Override: Priority Rank} = 0 \text{ when Zone} = \text{NEVER\_RETRY}$$

- **Value Component**: Scales linearly with contract value up to ₹8,000 (capping at 60 pts).
- **Urgency Component**: Scales as the 14-day dunning window elapses, reaching maximum 40 pts when only 1 day remains before subscription termination.
- **UI Display**: Formatted clearly as `₹Amount · ValuePts pts Value + UrgencyPts pts Urgency` to avoid misleading multiplication notation.

### 4. Avoided Fines & Penalties Calculation (₹2,25,000 Portfolio Total)
Card scheme excessive retry monitoring programs penalize merchants who repeatedly attempt authorizations on dead instruments:

$$\text{Avoided Fines} = \text{Hard Declines Compliantly Stopped} \times ₹25,000$$

- **Hard Decline Circuit Breaker (₹25,000 per violation avoided)**: Retrying a stolen, closed, or customer-revoked (MAC 21) card violates scheme excessive retry rules (VMMP / Category 2). Halting these immediately at 0 retries saves ~₹25,000 ($300) per incident.
- **Single-Event Non-Double-Count Guarantee**: Unlike naive models that double-count 0-attempt hard stops as both hard declines and ceiling limits, our engine strictly separates Hard Decline Circuit Breakers (0 attempts used) from Network Rolling Ceilings (exhausted attempt budget).
- **Network Rolling Ceilings**: 0 cap breaches across all 50 cases (100% compliant; all active dunning bounded under Visa $\le 15$ and Mastercard $\le 10$).

#### Portfolio & Benchmark Cohort Breakdown:
| Cohort Split | Cases | Hard Declines Compliantly Stopped (× ₹25,000) | Network Cap Violations | Total Avoided Fines |
| :--- | :---: | :---: | :---: | :---: |
| **Held-Out Test Cohort** | 25 | 4 cases (₹1,00,000) | 0 (100% compliant) | **₹1,00,000** |
| **Design Tuning Cohort** | 25 | 5 cases (₹1,25,000) | 0 (100% compliant) | **₹1,25,000** |
| **Full Portfolio Aggregate** | **50** | **9 cases (₹2,25,000)** | **0 (100% compliant)** | **₹2,25,000** |

---

## 🛡️ Regulatory & Scheme Compliance Enforcement

| Network / Regulation | Rule Specification | System Enforcement |
| :--- | :--- | :--- |
| **Visa Scheme Rules\*** | Max **15 retry attempts** within rolling 30-day window | Automated stop counter; blocks API dispatch after attempt 15 |
| **Mastercard Scheme Rules\***| Max **10 retry attempts** within rolling 30-day window | Automated stop counter; blocks API dispatch after attempt 10 |
| **RBI e-Mandate Circulars** | Pre-debit notification & customer consent tracking | Generates compliant mandate update URLs (`rzp.io/l/...`) |
| **Hard Decline Policy** | Lost card, stolen card, fraudulent card, account closed | **Immediate Zero-Retry Stop**; directs straight to card update outreach |

*\*Note: Retry ceilings (e.g. Visa 15, Mastercard 10 per 30-day window) are configured per published network merchant guidelines (such as the Visa Rules and Core Guidelines and Mastercard Transaction Processing Rules) and excessive retry monitoring programs. Exact enforcement thresholds may vary based on merchant category code (MCC), card product tier, and acquiring bank region.*

---

## ✨ Features

- **Live Razorpay Webhook Ingestion**: Real-time webhook listener (`/api/razorpay/webhook`) handling `payment.failed`, `payment.authorized`, and `payment_link.paid`.
- **Interactive Sandbox Lab**: Trigger and evaluate preset decline scenarios (`insufficient_fund`, `authentication_failed`, `card_stolen`, `gateway_technical_error`, `expired_card`).
- **Benchmark Evaluation Split**: Includes a pre-configured split of **Design Cohort** and **Held-Out Test Cohort** cases for repeatable benchmarking.
- **Google Gemini AI Outreach Synthesizer**: Dynamically generates context-aware, empathetic dunning messages in English, Hindi, and regional languages tailored to customer tenure and failure reason.
- **Immutable Audit Ledger**: Real-time logging of every diagnostic score, retry attempt, outreach dispatch, and compliance decision.

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- A [Razorpay Test Account](https://dashboard.razorpay.com/) *(optional for sandbox, required for live testing)*
- Google Gemini API Key

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/razorpay-subscription-recovery-agent.git
cd razorpay-subscription-recovery-agent
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Node Environment
NODE_ENV=development
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing Webhooks with Razorpay

1. In your Razorpay Dashboard, navigate to **Account & Settings → Webhooks → Add New Webhook**.
2. Set the Webhook URL to your hosted endpoint:
   ```text
   https://<your-domain>/api/razorpay/webhook
   ```
3. Set your Secret to match `RAZORPAY_WEBHOOK_SECRET`.
4. In the Active Events list, select:
   - `payment.failed` (Primary trigger)
   - `payment.authorized`
   - `payment_link.paid`
5. Click **Save Webhook**.
6. Use Razorpay's "Send Test Webhook" tool or the built-in Sandbox Lab to verify live ingestion.

---

## 📂 Project Structure

```text
├── server.ts                       # Express backend, Razorpay SDK, Webhooks & Gemini 3.7 API routes
├── src/
│   ├── App.tsx                     # Main Recovery Agent Dashboard UI
│   ├── types.ts                    # TypeScript schemas for Cases, Declines, Audit Trails & Compliance
│   ├── engine/
│   │   └── recoveryPipeline.ts     # 4-Stage Core Recovery Engine (Diagnosis, Zones, Scoring, Compliance)
│   ├── data/
│   │   └── seedData.ts             # Evaluation datasets (Design & Held-Out Cohorts) with dynamic pipeline runs
│   └── components/
│       ├── Header.tsx              # Navigation bar, status indicators, and ledger controls
│       ├── MetricsOverview.tsx     # Recovery rate, revenue saved, and compliance statistics
│       ├── PipelineStageFlow.tsx   # Interactive visualization of the 4-Stage bounded pipeline
│       ├── CaseTable.tsx           # Triage case table with sorting, filters, and priority ranking
│       ├── CaseDetailModal.tsx     # 4-Stage audit inspector, compliance gates & action controls
│       ├── HeldOutLedgerView.tsx   # Verifiable cohort comparison & audit trail exporter
│       ├── RazorpaySandboxLab.tsx  # Scenario simulation runner & custom webhook test generator
│       └── ArchitectureDocsModal.tsx # Interactive architecture and compliance documentation
├── index.html
├── package.json
└── vite.config.ts
```

---

## 📄 License
This project is licensed under the MIT License.


