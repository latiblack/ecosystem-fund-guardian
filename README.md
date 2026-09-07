# Ecosystem Fund Guardian

A GenLayer protocol where one contract governs another. The **Governance Contract** (AI-powered intelligent contract) defines spending rules in natural language, verifies deliverables via AI consensus, and authorizes payments. The **Spending Contract** (deterministic) holds funds but **cannot pay without the Governance Contract's permission**.

## Architecture

```
┌──────────────┐
│   Frontend   │  React + Vite — dashboard, forms
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Backend API │  Express — signer, mediates frontend ↔ contracts
└──┬───────┬───┘
   │       │
   ▼       ▼
┌────────────┐  ┌──────────────┐
│ Governance │  │   Spending   │
│  Contract  │  │   Contract   │
│ (GenLayer) │  │ (GenLayer)   │
│ AI-powered │  │ Deterministic│
└────────────┘  └──────────────┘
```

**Governance Contract** = the governor (stores rules, verifies evidence with AI, authorizes payments)
**Spending Contract** = the governed (holds tokens, can only pay when Governance says YES)

## How it works

1. **DAO approves** a spending proposal (on their own chain/tool)
2. **Project creates campaign** on Governance Contract (rules in natural language)
3. **Project funds** the Spending Contract (any token)
4. **Creator submits** evidence URL (social media post, blog, PR)
5. **GenLayer AI verifies** the evidence against the campaign rules
6. **Spending Contract pays** — but ONLY if Governance says verified

## Contracts

### Governance Contract (`contracts/governance.py`)
- `create_campaign()` — define rules, recipients, limits
- `submit_evidence()` — creator submits URL
- `verify()` — AI consensus reads URL, evaluates against rules
- `is_payment_allowed()` — returns YES/NO (called by Spending Contract)
- `get_campaign()` / `get_submission()` — views

### Spending Contract (`contracts/spending.py`)
- `fund()` — record deposit
- `pay()` — release payment (requires Governance approval)
- `get_campaign_funds()` — view

## Backend API (`server/src/server.js`)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Server status |
| `/api/campaign` | POST | Create campaign |
| `/api/campaign/:id` | GET | Get campaign |
| `/api/evidence` | POST | Submit evidence URL |
| `/api/verify` | POST | Trigger AI verification |
| `/api/pay` | POST | Release payment (checks governance first) |
| `/api/dashboard/:id` | GET | Combined campaign + submissions + funds |

## Frontend

- **Dashboard** — campaign stats, submissions table, verify/pay actions
- **Create Campaign** — form with rules, limits, recipients
- **Submit Evidence** — URL submission form

## Setup

```bash
# Server
cd server
cp .env.example .env
# Fill in GENLAYER_PRIVATE_KEY, GOVERNANCE_CONTRACT, SPENDING_CONTRACT
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

## Deploy contracts

```bash
# From GenLayer Studio or via genlayer CLI
genlayer deploy --contract contracts/governance.py
genlayer deploy --contract contracts/spending.py
```

## Hackathon demo

1. Create campaign: "Creator marketing — 5 creators, $2K each, must mention ProjectX"
2. Alice submits valid post → **VERIFIED** → **PAID** ✅
3. Bob submits garbage URL → **REJECTED** → **LOCKED** 🚫
4. Dashboard shows the whole picture
