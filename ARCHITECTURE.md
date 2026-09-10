# Ecosystem Fund Guardian — Architecture

## Overview

A GenLayer protocol where **projects create funds**, the community sees every rule and payment publicly, and AI consensus enforces compliance automatically.

**One smart contract governs another.** Projects lock ecosystem funds into a Spending Contract governed by a Governance Contract. Every disbursement requires AI-verified proof of deliverables. No proof = funds stay locked.

---

## Data Model

```
Project ──1:N── Campaign
  ├─ id (string)
  ├─ name (string)
  ├─ logo_url (string)
  ├─ description (string)
  ├─ chain (string)
  ├─ created_at (timestamp)

Campaign ──1:N── Submission
  ├─ campaign_id (string, FK → Project.id)
  ├─ creator (address)
  ├─ rules (string) — natural language spending policy
  ├─ max_per_recipient (string)
  ├─ duration_days (int)
  ├─ required_deliverables (string)
  ├─ recipients (string) — comma-separated addresses
  ├─ status ("active" | "paused" | "completed")
  ├─ created_at (timestamp)

Submission
  ├─ campaign_id (string)
  ├─ recipient (string)
  ├─ url (string) — evidence URL
  ├─ status ("pending" | "verified" | "rejected")
  ├─ reason (string) — AI verdict explanation
  ├─ submitted_at (timestamp)

Payment
  ├─ campaign_id (string)
  ├─ recipient (string)
  └─ paid_at (timestamp) — recorded on-chain only if verified
```

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                           │
│  Landing → Explore → Project Detail → Create Project → Lock Fund   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────────────┐
│                          BACKEND SERVER                             │
│  Express server (genlayer-js + ethers signer)                       │
│  Signs all writes. Frontend never touches GenLayer directly.        │
└──────┬──────────────────────────────┬───────────────────────────────┘
       │ writeContract                 │ readContract
       ▼                              ▼
┌────────────────────────┐    ┌──────────────────────────────────┐
│  GOVERNANCE CONTRACT   │◄──►│  SPENDING CONTRACT               │
│                        │    │                                  │
│  • Project Registry    │    │  • Fund Balances per Campaign    │
│  • Campaign CRUD       │    │  • Payment Ledger                │
│  • Evidence Store      │    │                                  │
│  • AI Verification     │    │  Can ONLY pay when Governance    │
│  • Payment Auth        │    │  returns ALLOWED                  │
└────────────────────────┘    └──────────────────────────────────┘
       │                              │
       ▼                              ▼
   gl.nondet.web.get             Token transfers
   gl.nondet.exec_prompt         (via backend signer)
   gl.eq_principle.prompt_comparative
```

---

## Full Flow

### Phase 1: Create Project

```
User fills form (name, logo URL, description, network)
        │
        ▼
POST /api/project → Server calls governance.create_project()
        │
        ▼
✅ Project created on-chain. Returns project_id.
        │
        ▼
Frontend shows congratulatory screen:
  "Project Created! [ProjectName]"
  "Now lock your ecosystem fund and define the rules."
  [Lock Funds Button]
```

### Phase 2: Choose Category & Lock Fund

```
User selects category (Marketing / Ecosystem Grants / etc.)
  → Rules template pre-filled

User fills fund details:
  - Token (USDC, HYPE, etc.)
  - Amount to lock
  - Duration (days)
  - Editable spending rules
  - Authorized recipients

        │
        ▼
POST /api/campaign → Server calls governance.create_campaign()
        │
        ▼
Server calls spending.fund(campaignId, token, amount)
        │
        ▼
✅ Fund locked. Governance + Spending contracts synchronized.
        │
        ▼
Frontend shows success screen with project + fund summary
[View Project] [Back Home]
```

### Phase 3: Submit Evidence

```
Recipient submits deliverable proof
  POST /api/evidence { campaignId, recipient, url }
        │
        ▼
Server calls governance.submit_evidence()
        │
        ▼
Status: pending — waiting for verification
```

### Phase 4: AI Verification

```
Owner/admin triggers verification
  POST /api/verify { campaignId, recipient }
        │
        ▼
Server calls governance.verify(campaignId, recipient)
        │
        ├── gl.nondet.web.get(url) — fetch evidence page
        ├── gl.nondet.exec_prompt() — LLM evaluates against rules
        └── gl.eq_principle.prompt_comparative() — AI consensus
        │
        ▼
Status: verified ✅ or rejected ❌
Reason attached to submission record
```

### Phase 5: Payment Release

```
If verified, owner calls payment release
  POST /api/pay { campaignId, recipient, amount }
        │
        ├── Step 1: governance.is_payment_allowed() — reads verification
        ├── If ALLOWED: spending.pay(campaignId, recipient, amount)
        └── If REJECTED: return 403 with rejection reason
        │
        ▼
✅ Payment recorded. Community can see it on dashboard.
```

---

## Contract Interfaces

### Governance Contract (`contracts/governance.py`)

| Function | Type | Params | Description |
|----------|------|--------|-------------|
| `create_project(name, logo_url, description, chain)` | write | — | Register a new project |
| `get_project(id)` | view | — | Read project data |
| `create_campaign(campaign_id, project_id, rules, max_per, duration, deliverables, recipients)` | write | — | Define spending rules |
| `submit_evidence(campaign_id, recipient, url)` | write | — | Submit deliverable proof |
| `verify(campaign_id, recipient)` | write | — | Trigger AI consensus |
| `is_payment_allowed(campaign_id, recipient)` | view | — | Returns `{allowed, reason}` |
| `get_campaign(campaign_id)` | view | — | Read campaign + its submissions |
| `get_all_campaigns()` | view | — | List all campaigns |

**AI Verification Flow:**
```python
url_content = gl.nondet.web.get(url)      # Fetch evidence
prompt_result = gl.nondet.exec_prompt(    # LLM evaluation
    "Evaluate if this content satisfies:\n" + rules,
    page_content=url_content.body
)
verdict = gl.eq_principle.prompt_comparative(  # Consensus
    prompt_result, principle="Verified must match"
)
submission.status = "verified" if verdict else "rejected"
submission.reason = verdict.reason
```

### Spending Contract (`contracts/spending.py`)

| Function | Type | Params | Description |
|----------|------|--------|-------------|
| `set_governance(address)` | write | governance_addr | Link to Governance Contract |
| `fund(campaign_id, token, amount)` | write | — | Record deposit |
| `pay(campaign_id, recipient, amount)` | write | — | Release payment (governed) |
| `get_campaign_funds(campaign_id)` | view | — | Balance, spent, remaining |
| `is_paid(campaign_id, recipient)` | view | — | Check if already paid |

**Governance Check in `pay()`:**
```python
@gl.public.write
def pay(self, campaign_id: str, recipient: str, amount: int) -> str:
    # Governance must explicitly allow this payment
    allowed = gl.interop.read_contract(
        self.governance_address,
        "is_payment_allowed",
        [campaign_id, recipient]
    )
    if not allowed.allowed:
        raise gl.vm.UserError(f"Not allowed: {allowed.reason}")
    
    cf = self.campaign_funds[campaign_id]
    if amount > cf.max_per_recipient:
        raise gl.vm.UserError("Exceeds max per recipient")
    if amount > cf.deposited - cf.spent:
        raise gl.vm.UserError("Insufficient balance")
    
    self.payments[f"{campaign_id}:{recipient}"] = "paid"
    cf.spent += amount
    return f"Paid: {amount} to {recipient}"
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/project` | Create project (step 1 of wizard) |
| GET | `/api/projects` | List all projects |
| GET | `/api/project/:id` | Get project details + funds |
| POST | `/api/campaign` | Create campaign + lock fund |
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaign/:id` | Get campaign with all submissions |
| GET | `/api/campaign/:id/submissions` | List submissions |
| POST | `/api/evidence` | Submit evidence URL |
| POST | `/api/verify` | Trigger AI verification |
| GET | `/api/submission/:id/:recipient` | Get submission status |
| POST | `/api/pay` | Release payment (checks governance first) |
| GET | `/api/spending/:campaignId` | Get fund balance |
| GET | `/api/dashboard/:campaignId` | Combined view |

---

## Deployment

```bash
# Deploy contracts to Bradbury testnet
genlayer deploy --contract contracts/governance.py
genlayer deploy --contract contracts/spending.py

# Configure server
cp server/.env.example server/.env
# Set GOVERNANCE_CONTRACT, SPENDING_CONTRACT, GENLAYER_PRIVATE_KEY

# Start server
cd server && npm start

# Deploy frontend
cd frontend && vercel --prod
```

---

## Key Design Decisions

1. **Project is first-class** — campaigns belong to projects; not all projects have funds yet
2. **Backend signs everything** — users don't need wallets on GenLayer
3. **Two-contract pattern** — Governance can govern Spending; Spending cannot bypass Governance
4. **AI consensus via eq_principle** — not a single LLM call; validators must agree
5. **Evidence = URL** — any web-accessible content; community can verify independently
6. **Rules are natural language** — no code needed; anyone can read them
7. **Community transparency** — every payment visible on the Explore page