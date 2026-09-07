# Ecosystem Fund Guardian

**Projects lie about ecosystem spending. Our tool makes it impossible.**

A GenLayer protocol where one contract governs another. Projects lock their ecosystem funds into a Spending Contract governed by a Governance Contract. Every disbursement requires AI-verified proof of deliverables. No proof = funds stay locked.

## The Problem

Projects announce tokenomics — "20% of supply goes to ecosystem fund." But there's no way to verify that. The team quietly takes part of it. No audit trail. No accountability. Community has to trust blindly.

## The Solution

Lock ecosystem funds in a governed contract. Define spending rules in natural language. Every disbursement requires verifiable evidence. AI consensus reads the evidence and verifies it matches the rules. The community sees everything on a public dashboard.

```
Project locks funds → Defines rules → Disbursement requested → Evidence submitted → AI verifies → Release or lock
```

## Architecture

```
┌──────────────────┐
│  Audit Dashboard  │  React + Vite — public transparency
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Backend API    │  Express — signer, mediates frontend ↔ contracts
└──┬───────────┬───┘
   │           │
   ▼           ▼
┌────────────┐  ┌──────────────────┐
│ Governance │  │    Spending      │
│  Contract  │  │    Contract      │
│ (GenLayer) │  │  (GenLayer)      │
│ AI-powered │  │  Deterministic   │
│ THE GOVERNOR│  │  THE GOVERNED    │
└────────────┘  └──────────────────┘
```

**Governance Contract** — the governor (stores rules, verifies evidence with AI, authorizes payments)
**Spending Contract** — the governed (holds tokens, can only pay when Governance says YES)

This is "a contract governing another contract." The Spending Contract literally cannot pay without the Governance Contract's permission.

## How Projects Use It

1. **DAO votes** to allocate 20% of tokens to ecosystem (on their own chain)
2. **Project locks** those tokens in the Spending Contract on GenLayer
3. **Project defines** what the funds can be used for (natural language rules)
4. **Disbursement requests** come in with evidence URLs
5. **AI consensus** reads the evidence and verifies it matches the rules
6. **Only verified disbursements** get paid. No proof = funds stay locked.
7. **Community audits** the dashboard — every transaction visible

## Contracts

### Governance Contract (`contracts/governance.py`)
- `create_campaign()` — define spending rules in natural language
- `submit_evidence()` — submit proof of deliverable (URL)
- `verify()` — AI consensus reads URL, evaluates against rules
- `is_payment_allowed()` — returns YES/NO (called by Spending Contract)
- `get_campaign()` / `get_submission()` — audit views

### Spending Contract (`contracts/spending.py`)
- `fund()` — lock ecosystem tokens
- `pay()` — release payment (governed by Governance Contract)
- `get_campaign_funds()` — view fund status

## Dashboard

The public audit dashboard shows:
- **Compliance status** — compliant / violations detected / pending review
- **Fund stats** — total locked, disbursed, remaining
- **Audit trail** — every disbursement with evidence, AI verdict, and outcome
- **Fund policy** — what the funds can be used for

## Setup

```bash
# Server
cd server && cp .env.example .env && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

## Deploy contracts

```bash
genlayer deploy --contract contracts/governance.py
genlayer deploy --contract contracts/spending.py
```

## Hackathon Demo

1. "ProjectX allocated 500K tokens to ecosystem"
2. Lock funds + define policy: "Marketing, grants, bounties — verified by evidence"
3. Marketing agency delivers → evidence verified → **PAID** ✅
4. Team member tries to drain funds with no deliverable → **REJECTED** → **LOCKED** ��
5. Dashboard: full audit trail anyone can see
