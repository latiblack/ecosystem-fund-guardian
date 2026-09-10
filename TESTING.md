# Ecosystem Fund Guardian — Testing Guide

## Backend Tests (No GenLayer Required)

```bash
cd server
node --test test-backend.js
```

**Result: 10/10 passing** ✅

Tests cover:
- `POST /api/project` — Create project endpoint
- `GET /api/projects` — List all projects
- `POST /api/campaign` — Create campaign with project_id validation
- Full flow: Create Project → Lock Fund → Submit Evidence → Verify

## Contract Deployment & Testing

### Prerequisites
1. Docker running (`docker ps`)
2. GenLayer account exists (`genlayer account list`)
3. GEN tokens in wallet (for gas)

### Deploy to Local Simulator
```bash
# Start local Bradbury testnet
genlayer up --headless --numValidators 1

# Deploy contracts
genlayer deploy --contract contracts/governance.py
genlayer deploy --contract contracts/spending.py

# Link contracts
genlayer write <SPENDING_ADDR> set_governance --args "<GOVERNANCE_ADDR>"
```

### Deploy to Bradbury Testnet
```bash
# Set RPC (update in server/.env)
GENLAYER_RPC=https://rpc.bradbury.genlayer.com

# Deploy
genlayer deploy --contract contracts/governance.py --rpc $GENLAYER_RPC
genlayer deploy --contract contracts/spending.py --rpc $GENLAYER_RPC
```

### Run Contract Test Script
```bash
node test-contract.js
```

This tests:
1. Environment check (CLI, accounts)
2. Governance contract deployment
3. Spending contract deployment
4. Contract linking
5. Integration tests:
   - Create project
   - Get project
   - List projects
   - Create campaign
   - Get campaign
   - Submit evidence
   - Payment authorization check

## Server Setup

```bash
cd server
cp .env.example .env
# Edit .env:
#   GENLAYER_PRIVATE_KEY=<your_key>
#   GOVERNANCE_CONTRACT=<deployed_address>
#   SPENDING_CONTRACT=<deployed_address>

npm install
npm start
```

## API Endpoints (After Deployment)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/project` | Create project (step 1 of wizard) |
| GET | `/api/projects` | List all projects |
| GET | `/api/project/:id` | Get project details |
| POST | `/api/campaign` | Create campaign + lock fund |
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaign/:id` | Get campaign with submissions |
| POST | `/api/evidence` | Submit evidence URL |
| POST | `/api/verify` | Trigger AI verification |
| GET | `/api/submission/:id/:recipient` | Get submission status |
| POST | `/api/pay` | Release payment (checks governance) |
| GET | `/api/spending/:campaignId` | Get fund balance |

## Current Status

- ✅ Frontend deployed to Vercel
- ✅ Backend API endpoints implemented
- ✅ Backend tests passing
- ⏳ Contracts pending deployment to Bradbury
- ⏳ Server `.env` needs contract addresses
