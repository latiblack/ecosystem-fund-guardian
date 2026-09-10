import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyMessage, getContract, createPublicClient, http, parseEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ──────────────────────────────────────────────
// Multi-chain EVM Configuration
// ──────────────────────────────────────────────

const PRIVATE_KEY = (process.env.GENLAYER_PRIVATE_KEY || "").trim();
const GOVERNANCE_ADDRESS = (process.env.GOVERNANCE_CONTRACT || "").trim();
const SPENDING_ADDRESS = (process.env.SPENDING_CONTRACT || "").trim();

if (!PRIVATE_KEY) throw new Error("GENLAYER_PRIVATE_KEY required");
if (!GOVERNANCE_ADDRESS) throw new Error("GOVERNANCE_CONTRACT required");
if (!SPENDING_ADDRESS) throw new Error("SPENDING_CONTRACT required");

// Ensure private key is 64 hex chars (without 0x prefix)
const cleanKey = PRIVATE_KEY.replace(/^0x/, "");
if (cleanKey.length !== 64) {
  throw new Error(`Invalid private key length: ${cleanKey.length}, expected 64`);
}

// Server's private account
const account = privateKeyToAccount(`0x${cleanKey}`);
console.log(`Server wallet: ${account.address}`);

// In-memory storage for projects and campaigns
const projects = {};
const campaigns = {};

// ──────────────────────────────────────────────
// Chain Configuration for any EVM network
// ──────────────────────────────────────────────

const CHAIN_CONFIG = {
  1: { name: "Ethereum", nativeToken: "ETH", decimals: 18 },
  5: { name: "Goerli", nativeToken: "ETH", decimals: 18 },
  10: { name: "Optimism", nativeToken: "ETH", decimals: 18 },
  56: { name: "BNB Smart Chain", nativeToken: "BNB", decimals: 18 },
  137: { name: "Polygon", nativeToken: "MATIC", decimals: 18 },
  42161: { name: "Arbitrum", nativeToken: "ETH", decimals: 18 },
  43114: { name: "Avalanche", nativeToken: "AVAX", decimals: 18 },
  11155111: { name: "Sepolia", nativeToken: "ETH", decimals: 18 },
};

// Bradbury testnet (custom RPC)
const BRADBURY_CHAIN_ID = 4216; // Example - update with actual Bradbury chain ID

/**
 * Get a viem public client for any EVM chain
 */
function getChainClient(chainId) {
  const config = CHAIN_CONFIG[chainId];
  if (config) {
    // Use public RPCs for major chains
    const rpcUrls = {
      1: "https://eth.llamarpc.com",
      5: "https://rpc.goerli.gateway.fm",
      10: "https://optimism.llamarpc.com",
      56: "https://bsc-dataseed.binance.org",
      137: "https://polygon-rpc.com",
      42161: "https://arb1.arbitrum.io/rpc",
      43114: "https://api.avax.network/ext/bc/C/rpc",
      11155111: "https://sepolia.gateway.tenderly.co",
    };
    
    return createPublicClient({
      chain: {
        id: chainId,
        name: config.name,
        nativeCurrency: { decimals: 18, name: config.nativeToken, symbol: config.nativeToken },
        rpcUrls: { default: { http: [rpcUrls[chainId]] } },
      },
      transport: http(rpcUrls[chainId]),
    });
  }
  
  // For custom chains like Bradbury, use RPC from env
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
  return createPublicClient({
    chain: {
      id: chainId,
      name: `Custom Chain ${chainId}`,
      nativeCurrency: { decimals: 18, name: "ETH", symbol: "ETH" },
      rpcUrls: { default: { http: [rpcUrl] } },
    },
    transport: http(rpcUrl),
  });
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Check wallet balance on any EVM chain
 */
async function getBalance(address, chainId) {
  const client = getChainClient(chainId);
  try {
    const balance = await client.getBalance({ address });
    return Number(balance) / 1e18;
  } catch (err) {
    console.error("Balance check error:", err.message);
    return 0;
  }
}

/**
 * Verify EIP-191 signature
 */
function verifySignature(walletAddress, signature, message) {
  try {
    const normalizedAddress = walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`;
    const verified = verifyMessage({
      address: normalizedAddress,
      message,
      signature,
    });
    return verified.toLowerCase() === normalizedAddress.toLowerCase();
  } catch (err) {
    console.error("Signature verification error:", err.message);
    return false;
  }
}

/**
 * Approve ERC-20 token spending for contract
 */
async function approveToken(tokenAddress, spenderAddress, amount, chainId) {
  const client = getChainClient(chainId);
  
  // ERC-20 approve ABI
  const ERC20_ABI = [
    {
      constant: false,
      inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
  ];
  
  const contract = getContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    client,
    account,
  });
  
  const txHash = await contract.write.approve([spenderAddress, amount]);
  console.log(`Token approval tx: ${txHash}`);
  
  return txHash;
}

/**
 * Transfer ERC-20 tokens
 */
async function transferToken(tokenAddress, toAddress, amount, chainId) {
  const client = getChainClient(chainId);
  
  const ERC20_ABI = [
    {
      constant: false,
      inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
      name: "transfer",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
  ];
  
  const contract = getContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    client,
    account,
  });
  
  const txHash = await contract.write.transfer([toAddress, amount]);
  console.log(`Token transfer tx: ${txHash}`);
  
  return txHash;
}

/**
 * Lock native token (ETH/MATIC/BNB etc.)
 */
async function lockNativeToken(amount, chainId) {
  const client = getChainClient(chainId);
  
  const txHash = await client.sendTransaction({
    account,
    to: SPENDING_ADDRESS,
    value: amount, // in wei
  });
  
  console.log(`Native token lock tx: ${txHash}`);
  return txHash;
}

// ──────────────────────────────────────────────
// Health
// ──────────────────────────────────────────────

app.get("/health", async (req, res) => {
  try {
    const chainId = parseInt(req.query.chainId) || 1;
    const balance = await getBalance(account.address, chainId);
    
    res.json({
      status: "ok",
      signer: account.address,
      balance,
      governance: GOVERNANCE_ADDRESS,
      spending: SPENDING_ADDRESS,
      supported_chains: Object.keys(CHAIN_CONFIG).map(Number),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────

app.post("/api/project", async (req, res) => {
  try {
    const {
      project_id,
      name,
      logo_url,
      description,
      chain,
      chainId,
      creator,
      signature
    } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({ error: "project_id and name required" });
    }
    
    if (!creator || !signature) {
      return res.status(400).json({ error: "Wallet connection required: provide creator address and signature" });
    }
    
    // Validate EVM chain
    const chainIdNum = parseInt(chainId);
    if (isNaN(chainIdNum) || chainIdNum < 1) {
      return res.status(400).json({ error: "Invalid chain ID. Must be a valid EVM chain." });
    }
    
    // Verify signature
    const message = JSON.stringify({ project_id, name });
    const isValid = verifySignature(creator, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid wallet signature" });
    }
    
    // Store project locally (in production, would write to contract)
    projects[project_id] = {
      project_id,
      name,
      logo_url: logo_url || "",
      description: description || "",
      chain: chain || CHAIN_CONFIG[chainIdNum]?.name || `Chain ${chainIdNum}`,
      chainId: chainIdNum,
      creator: creator,
      created_at: new Date().toISOString(),
      status: "active"
    };
    
    console.log(`Project created: ${project_id} on chain ${chainIdNum}`);
    
    res.json({
      success: true,
      projectId: project_id,
      chainId: chainIdNum,
      message: `Project created on ${CHAIN_CONFIG[chainIdNum]?.name || 'custom chain'}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/projects", async (req, res) => {
  res.json(Object.values(projects));
});

app.get("/api/project/:id", async (req, res) => {
  const project = projects[req.params.id];
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});

// ──────────────────────────────────────────────
// Campaigns with Token Locking
// ──────────────────────────────────────────────

app.post("/api/campaign", async (req, res) => {
  try {
    const {
      campaignId,
      project_id,
      rules,
      maxPerRecipient,
      durationDays,
      requiredDeliverables,
      recipients,
      tokenAddress,
      tokenSymbol,
      chainId,
      creator,
      signature,
    } = req.body;

    if (!campaignId || !rules || !project_id) {
      return res.status(400).json({ error: "campaignId, project_id, and rules required" });
    }
    
    if (!creator || !signature) {
      return res.status(400).json({ error: "Wallet connection required" });
    }

    // Verify signature
    const message = JSON.stringify({ campaignId, project_id, tokenAddress });
    const isValid = verifySignature(creator, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid wallet signature" });
    }

    // Verify project exists and user is creator
    const project = projects[project_id];
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (creator.toLowerCase() !== project.creator.toLowerCase()) {
      return res.status(403).json({ error: "Only project creator can create campaigns" });
    }

    // Parse recipients
    const recipientList = typeof recipients === "string" ? JSON.parse(recipients) : recipients;
    const amounts = typeof req.body.amounts === "string" ? JSON.parse(req.body.amounts) : req.body.amounts;

    if (!recipientList || recipientList.length === 0) {
      return res.status(400).json({ error: "Recipients required" });
    }

    // Store campaign
    const campaign = {
      id: campaignId,
      project_id,
      creator: creator,
      rules,
      max_per_recipient: maxPerRecipient || "0",
      duration_days: durationDays || 90,
      required_deliverables: requiredDeliverables || "",
      recipients: recipientList,
      amounts: amounts || recipientList.map(() => "0"),
      token_address: tokenAddress || "native",
      token_symbol: tokenSymbol || "ETH",
      chain_id: chainId || project.chainId,
      status: "active",
      total_locked: 0,
      created_at: new Date().toISOString(),
    };

    campaigns[campaignId] = campaign;

    res.json({
      success: true,
      campaignId,
      message: "Campaign created - ready to lock tokens",
      next_step: "lock_tokens"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaigns", async (req, res) => {
  res.json(Object.values(campaigns));
});

app.get("/api/campaign/:id", async (req, res) => {
  const campaign = campaigns[req.params.id];
  res.json(campaign || { error: "Campaign not found" });
});

// ──────────────────────────────────────────────
// Token Locking Endpoints
// ──────────────────────────────────────────────

/**
 * Lock tokens for a campaign
 * Supports both native tokens and ERC-20 tokens
 */
app.post("/api/campaign/:id/lock-tokens", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const {
      walletAddress,
      signature,
      tokenAddress,      // "native" for native token, or ERC-20 address
      amount,            // Amount to lock
      chainId,           // EVM chain ID
    } = req.body;

    const campaign = campaigns[campaignId];
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Verify signature
    const message = JSON.stringify({ campaignId, amount, tokenAddress });
    const isValid = verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Verify wallet matches campaign creator
    if (walletAddress.toLowerCase() !== campaign.creator.toLowerCase()) {
      return res.status(403).json({ error: "Only campaign creator can lock tokens" });
    }

    const cId = parseInt(chainId) || campaign.chain_id;
    let txHash;

    if (tokenAddress === "native" || !tokenAddress) {
      // Lock native token (ETH, MATIC, BNB, etc.)
      const amountInWei = parseEther(amount.toString());
      txHash = await lockNativeToken(amountInWei, cId);
    } else {
      // Lock ERC-20 token
      const tokenDecimals = 18; // Common default, could be fetched from contract
      const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
      
      // First approve the spending contract
      txHash = await approveToken(tokenAddress, SPENDING_ADDRESS, amountInUnits, cId);
      
      // Then transfer to contract
      await transferToken(tokenAddress, SPENDING_ADDRESS, amountInUnits, cId);
    }

    // Update campaign locked amount
    campaign.total_locked = parseFloat(campaign.total_locked) + parseFloat(amount);
    campaigns[campaignId] = campaign;

    res.json({
      success: true,
      txHash,
      message: `Successfully locked ${amount} ${tokenAddress === "native" ? "native token" : tokenAddress}`,
      campaign: campaign
    });
  } catch (err) {
    console.error("Token lock error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get token balance for wallet on specific chain
 */
app.get("/api/balance", async (req, res) => {
  try {
    const { address, tokenAddress, chainId } = req.body;
    
    if (!address || !chainId) {
      return res.status(400).json({ error: "address and chainId required" });
    }

    const cId = parseInt(chainId);
    
    if (tokenAddress === "native" || !tokenAddress) {
      // Native token balance
      const balance = await getBalance(address, cId);
      return res.json({ balance, token: "native", chainId: cId });
    } else {
      // ERC-20 token balance
      const client = getChainClient(cId);
      
      const ERC20_ABI = [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ];
      
      const contract = getContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        client,
      });
      
      const balance = await contract.read.balanceOf([address]);
      const balanceFormatted = Number(balance) / 1e18;
      
      return res.json({ balance: balanceFormatted, token: tokenAddress, chainId: cId });
    }
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
  console.log(`Supporting all EVM-compatible chains`);
});
