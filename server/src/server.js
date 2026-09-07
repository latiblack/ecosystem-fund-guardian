import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ──────────────────────────────────────────────
// GenLayer client
// ──────────────────────────────────────────────

const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY;
const GOVERNANCE_ADDRESS = process.env.GOVERNANCE_CONTRACT;
const SPENDING_ADDRESS = process.env.SPENDING_CONTRACT;

if (!PRIVATE_KEY) throw new Error("GENLAYER_PRIVATE_KEY required");

const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: testnetBradbury, account });

// Write mutex (same pattern as task-verifier)
let writeQueue = Promise.resolve();

function enqueueWrite(fn) {
  writeQueue = writeQueue.then(fn).catch((err) => {
    console.error("Write error:", err.message);
    throw err;
  });
  return writeQueue;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

async function readContract(address, functionName, args = []) {
  return client.readContract({ address, functionName, args });
}

async function writeContract(address, functionName, args) {
  return enqueueWrite(async () => {
    const hash = await client.writeContract({
      address,
      functionName,
      args,
      value: 0n,
    });
    console.log(`Tx sent: ${functionName} → ${hash}`);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      retries: 30,
      interval: 5000,
    });
    return { hash, receipt };
  });
}

// ──────────────────────────────────────────────
// Health
// ──────────────────────────────────────────────

app.get("/health", async (req, res) => {
  try {
    const bal = await client.request({
      method: "eth_getBalance",
      params: [account.address, "latest"],
    });
    const balance = Number(BigInt(bal)) / 1e18;
    res.json({
      status: "ok",
      signer: account.address,
      balance,
      governance: GOVERNANCE_ADDRESS,
      spending: SPENDING_ADDRESS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Campaigns
// ──────────────────────────────────────────────

// Create campaign
app.post("/api/campaign", async (req, res) => {
  try {
    const {
      campaignId,
      rules,
      maxPerRecipient,
      durationDays,
      requiredDeliverables,
      recipients,
    } = req.body;

    if (!campaignId || !rules) {
      return res.status(400).json({ error: "campaignId and rules required" });
    }

    const { hash } = await writeContract(GOVERNANCE_ADDRESS, "create_campaign", [
      campaignId,
      rules,
      maxPerRecipient || "0",
      durationDays || 30,
      requiredDeliverables || "",
      recipients || "",
    ]);

    res.json({ success: true, txHash: hash, campaignId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all campaigns
app.get("/api/campaigns", async (req, res) => {
  try {
    const campaigns = await readContract(
      GOVERNANCE_ADDRESS,
      "get_all_campaigns",
      []
    );
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign
app.get("/api/campaign/:id", async (req, res) => {
  try {
    const campaign = await readContract(
      GOVERNANCE_ADDRESS,
      "get_campaign",
      [req.params.id]
    );
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all submissions for a campaign
app.get("/api/campaign/:id/submissions", async (req, res) => {
  try {
    const submissions = await readContract(
      GOVERNANCE_ADDRESS,
      "get_campaign_submissions",
      [req.params.id]
    );
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Evidence
// ──────────────────────────────────────────────

// Submit evidence
app.post("/api/evidence", async (req, res) => {
  try {
    const { campaignId, recipient, url } = req.body;

    if (!campaignId || !recipient || !url) {
      return res
        .status(400)
        .json({ error: "campaignId, recipient, and url required" });
    }

    const { hash } = await writeContract(
      GOVERNANCE_ADDRESS,
      "submit_evidence",
      [campaignId, recipient, url]
    );

    res.json({ success: true, txHash: hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify evidence (triggers AI consensus — can take 5-10 min)
app.post("/api/verify", async (req, res) => {
  try {
    const { campaignId, recipient } = req.body;

    if (!campaignId || !recipient) {
      return res.status(400).json({ error: "campaignId and recipient required" });
    }

    const { hash } = await writeContract(GOVERNANCE_ADDRESS, "verify", [
      campaignId,
      recipient,
    ]);

    res.json({ success: true, txHash: hash, message: "Verification submitted — may take 5-10 minutes" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get submission status
app.get("/api/submission/:campaignId/:recipient", async (req, res) => {
  try {
    const submission = await readContract(
      GOVERNANCE_ADDRESS,
      "get_submission",
      [req.params.campaignId, req.params.recipient]
    );
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────

// Release payment (checks governance first)
app.post("/api/pay", async (req, res) => {
  try {
    const { campaignId, recipient, amount } = req.body;

    if (!campaignId || !recipient || !amount) {
      return res
        .status(400)
        .json({ error: "campaignId, recipient, and amount required" });
    }

    // Step 1: Check governance
    const auth = await readContract(GOVERNANCE_ADDRESS, "is_payment_allowed", [
      campaignId,
      recipient,
    ]);

    if (!auth.allowed) {
      return res.status(403).json({
        error: "Payment not allowed by governance",
        reason: auth.reason,
      });
    }

    // Step 2: Execute payment via spending contract
    const { hash } = await writeContract(SPENDING_ADDRESS, "pay", [
      campaignId,
      recipient,
      Number(amount),
    ]);

    res.json({
      success: true,
      txHash: hash,
      governanceReason: auth.reason,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get spending info
app.get("/api/spending/:campaignId", async (req, res) => {
  try {
    const funds = await readContract(SPENDING_ADDRESS, "get_campaign_funds", [
      req.params.campaignId,
    ]);
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Dashboard data (combined view)
// ──────────────────────────────────────────────

app.get("/api/dashboard/:campaignId", async (req, res) => {
  try {
    const campaignId = req.params.campaignId;

    const [campaign, submissions, funds] = await Promise.all([
      readContract(GOVERNANCE_ADDRESS, "get_campaign", [campaignId]),
      readContract(GOVERNANCE_ADDRESS, "get_campaign_submissions", [campaignId]),
      readContract(SPENDING_ADDRESS, "get_campaign_funds", [campaignId]),
    ]);

    res.json({ campaign, submissions, funds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Ecosystem Fund Guardian API running on port ${PORT}`);
  console.log(`Signer: ${account.address}`);
  console.log(`Governance: ${GOVERNANCE_ADDRESS}`);
  console.log(`Spending: ${SPENDING_ADDRESS}`);
});
