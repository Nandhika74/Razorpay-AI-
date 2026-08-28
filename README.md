# ⚡ Razorpay Autonomous Subscription Recovery Agent
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

## 🏗️ Architecture & 4-Stage Decision Pipel
┌────────────────────────────────────┐
                 │   Razorpay Webhook: payment.failed │
                 └─────────────────┬──────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: CONTEXT-ADJUSTED DIAGNOSIS │
│ • Extracts Razorpay Error Taxonomies (BAD_REQUEST, GATEWAY_ERROR, etc.) │
│ • Ingests Customer Payment History & Tenure Baseline │
│ • Computes Anomaly "Surprise Index" for VIP vs. Chronic Failure detection │
└─────────────────────────────────────┬──────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: 3-ZONE ACTION CLASSIFICATION │
│ • RETRY_NOW : Transient gateway timeouts, network dropouts with jitter │
│ • RETRY_LATER : Soft balance / daily limit declines on smart payday windows│
│ • NEVER_RETRY : Hard declines (stolen card, closed account, mandate void) │
└─────────────────────────────────────┬──────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: DUAL-SCORE PRIORITIZATION │
│ • Orthogonal Scoring: Recovery Likelihood % vs. Recovery Priority Score │
│ • Weighted by Contract Value (MRR/ARR), Urgency Factor & Retry Exhaustion │
└─────────────────────────────────────┬──────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: BOUNDED EXECUTION & COMPLIANCE GUARD │
│ • Visa Cap Guard: Max 15 attempts per rolling 30-day window │
│ • Mastercard Cap Guard: Max 10 attempts per rolling 30-day window │
│ • Zero-Retry Circuit Breaker on Hard Declines │
└─────────────────────────────────────┬──────────────────────────────────────┘
│
┌──────────────────┴──────────────────┐
▼ ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ Autonomous Retry Exec │ │ Gemini AI Smart Outreach │
│ (Razorpay SDK / API) │ │ (WhatsApp / SMS / Email) │
└───────────────────────────┘ └───────────────────────────┘
                                   ---

## 📐 Mathematical Models & Formulas

### 1. The Customer "Surprise Index"
Quantifies whether a payment failure is an unexpected anomaly for a loyal customer or a chronic liquidity risk:

$$\text{Surprise Index} = \text{Historical Success Rate} \times \left(\frac{\min(\text{Tenure Months}, 12)}{12}\right) \times \left(1 - \frac{\text{Failures In Past Year}}{10}\right)$$

- **VIP Customer (Tenure: 18m, 0 failures)**: $1.0 \times 1.0 \times 1.0 = \mathbf{1.00}$ *(High protection, zero aggressive dunning)*
- **At-Risk / New Customer (Tenure: 2m, 3 failures)**: $0.50 \times \frac{2}{12} \times 0.70 = \mathbf{0.058}$ *(Low surprise, standard dunning queue)*

### 2. Recovery Likelihood Score (%)
A multi-factor predictive probability combining:
- **Error Code Reversibility Weight** ($W_e$): `GATEWAY_ERROR` (95%), `insufficient_fund` (75%), `card_closed` (0%)
- **Surprise Index Boost** ($B_s$): $+15\%$ for VIP anomalies
- **Retry Fatigue Penalty** ($P_r$): $-8\%$ deduction per prior failed attempt

$$\text{Likelihood} = \max\left(0\%, \min\left(100\%, (W_e \times 100) + (B_s \times \text{Surprise}) - (P_r \times \text{Prior Attempts})\right)\right)$$

### 3. Recovery Priority Score
Determines the dynamic queue order to maximize recovered revenue per agent cycle:

$$\text{Priority Score} = \text{Amount (INR)} \times \text{Recovery Likelihood} \times \text{Urgency Factor}$$

---

## 🛡️ Regulatory & Scheme Compliance Enforcement

| Network / Regulation | Rule Specification | System Enforcement |
| :--- | :--- | :--- |
| **Visa Scheme Rules** | Max **15 retry attempts** within rolling 30-day window | Automated stop counter; blocks API dispatch after attempt 15 |
| **Mastercard Scheme Rules**| Max **10 retry attempts** within rolling 30-day window | Automated stop counter; blocks API dispatch after attempt 10 |
| **RBI e-Mandate Circulars** | Pre-debit notification & customer consent tracking | Generates compliant mandate update URLs (`rzp.io/l/...`) |
| **Hard Decline Policy** | Lost card, stolen card, fraudulent card, account closed | **Immediate Zero-Retry Stop**; directs straight to card update outreach |

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
2. Configure Environment Variables
Create a .env file in the root directory:
code
Env
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Node Environment
NODE_ENV=development
PORT=3000
3. Run Development Server
code
Bash
npm run dev
Open http://localhost:3000 in your browser.
🧪 Testing Webhooks with Razorpay
In your Razorpay Dashboard, navigate to Account & Settings → Webhooks → Add New Webhook.
Set the Webhook URL to your hosted endpoint or ngrok tunnel:
code
Code
https://<your-domain>/api/razorpay/webhook
Set your Secret to match RAZORPAY_WEBHOOK_SECRET.
In the Active Events list, select:
payment.failed (Primary trigger)
payment.authorized
payment_link.paid
Click Save Webhook.
Use Razorpay's "Send Test Webhook" tool to verify live ingestion.
📂 Project Structure
code
Code
├── server.ts                 # Express backend, Razorpay SDK, Webhooks & Gemini API routes
├── src/
│   ├── App.tsx               # Main Recovery Agent Dashboard UI
│   ├── types.ts              # TypeScript schemas for Cases, Declines & Audit Trails
│   ├── benchmarkData.ts      # Design & Held-Out evaluation dataset
│   ├── components/
│   │   ├── CaseCard.tsx      # Triage card with zone badges & priority scores
│   │   ├── CaseDrawer.tsx    # 4-Stage audit inspector & interactive action controls
│   │   ├── SandboxModal.tsx  # Scenario simulation runner
│   │   ├── OutreachModal.tsx # Gemini AI message synthesizer
│   │   └── MetricsHeader.tsx # Live pipeline telemetry & salvage rates
├── index.html
├── package.json
└── vite.config.ts
📄 License
This project is licensed under the MIT License.

