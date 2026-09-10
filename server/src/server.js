import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifyMessage, getContract, createPublicClient, http, parseEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ──────────────────────────────────────────────
// Multi-chain EVM Configuration
// ──────────────────────────────────────────────

const PRIVATE_KEY = (process.env.GENLAYER_PRIVATE_KEY || "").trim();
const GOVERNANCE_ADDRESS = (process.env.GOVERNANCE_CONTRACT || "").trim();
const SPENDING_ADDRESS = (process.env.SPENDING_CONTRACT || "").trim();
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || "";

if (!PRIVATE_KEY) throw new Error("GENLAYER_PRIVATE_KEY required");
if (!GOVERNANCE_ADDRESS) throw new Error("GOVERNANCE_CONTRACT required");
if (!SPENDING_ADDRESS) throw new Error("SPENDING_CONTRACT required");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL required");
if (!SUPABASE_SERVICE_ROLE) throw new Error("SUPABASE_SERVICE_ROLE required");

// Ensure private key is 64 hex chars (without 0x prefix)
const cleanKey = PRIVATE_KEY.replace(/^0x/, "");
if (cleanKey.length !== 64) {
  throw new Error(`Invalid private key length: ${cleanKey.length}, expected 64`);
}

// Server's private account
const account = privateKeyToAccount(`0x${cleanKey}`);
console.log(`Server wallet: ${account.address}`);

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

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

/**
 * Get a viem public client for any EVM chain
 */
function getChainClient(chainId) {
  const config = CHAIN_CONFIG[chainId];
  if (config) {
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
    value: amount,
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
      supabase_connected: !!SUPABASE_URL,
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
    
    // Store project in Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: project_id,
        name,
        logo_url: logo_url || null,
        description: description || null,
        creator_address: creator,
        chain_id: chainIdNum,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`Project created in Supabase: ${project_id} on chain ${chainIdNum}`);
    
    res.json({
      success: true,
      projectId: project_id,
      chainId: chainIdNum,
      data,
      message: `Project created in database on ${CHAIN_CONFIG[chainIdNum]?.name || 'custom chain'}`
    });
  } catch (err) {
    console.error("Project creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/project/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();
    
    if (projectError) throw projectError;
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (creator.toLowerCase() !== project.creator_address.toLowerCase()) {
      return res.status(403).json({ error: "Only project creator can create campaigns" });
    }

    // Parse recipients
    const recipientList = typeof recipients === "string" ? JSON.parse(recipients) : recipients;

    if (!recipientList || recipientList.length === 0) {
      return res.status(400).json({ error: "Recipients required" });
    }

    // Store campaign in Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        id: campaignId,
        project_id,
        category: req.body.category || 'ecosystem',
        creator_address: creator,
        signature,
        rules,
        max_per_recipient: maxPerRecipient || 0,
        duration_days: durationDays || 90,
        recipients: JSON.stringify(recipientList),
        token_address: tokenAddress || 'native',
        token_symbol: tokenSymbol || 'ETH',
        chain_id: chainId || project.chain_id,
      })
      .select()
      .single();
    
    if (error) throw error;

    console.log(`Campaign created in Supabase: ${campaignId}`);

    res.json({
      success: true,
      campaignId,
      message: "Campaign created in database - ready to lock tokens",
      next_step: "lock_tokens",
      data
    });
  } catch (err) {
    console.error("Campaign creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaigns", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, projects(name, description, logo_url, creator_address, chain_id)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaign/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, projects(name, description, logo_url, creator_address, chain_id)')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Token Locking Endpoints
// ──────────────────────────────────────────────

app.post("/api/campaign/:id/lock-tokens", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const {
      walletAddress,
      signature,
      tokenAddress,
      amount,
      chainId,
    } = req.body;

    // Get campaign from Supabase
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (campaignError) throw campaignError;
    
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
    if (walletAddress.toLowerCase() !== campaign.creator_address.toLowerCase()) {
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
      const tokenDecimals = 18;
      const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
      
      // First approve the spending contract
      txHash = await approveToken(tokenAddress, SPENDING_ADDRESS, amountInUnits, cId);
      
      // Then transfer to contract
      await transferToken(tokenAddress, SPENDING_ADDRESS, amountInUnits, cId);
    }

    // Update campaign in Supabase
    await supabase
      .from('campaigns')
      .update({ total_locked: campaign.total_locked + parseFloat(amount) })
      .eq('id', campaignId);

    res.json({
      success: true,
      txHash,
      message: `Successfully locked ${amount} ${tokenAddress === "native" ? "native token" : tokenAddress}`,
      campaign
    });
  } catch (err) {
    console.error("Token lock error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/balance", async (req, res) => {
  try {
    const { address, tokenAddress, chainId } = req.body;
    
    if (!address || !chainId) {
      return res.status(400).json({ error: "address and chainId required" });
    }

    const cId = parseInt(chainId);
    
    if (tokenAddress === "native" || !tokenAddress) {
      const balance = await getBalance(address, cId);
      return res.json({ balance, token: "native", chainId: cId });
    } else {
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
      return res.json({ balance: Number(balance) / 1e18, token: tokenAddress, chainId: cId });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Evidence Submissions
// ──────────────────────────────────────────────

app.post("/api/evidence", async (req, res) => {
  try {
    const { campaign_id, recipient_address, url, chain_id } = req.body;
    
    if (!campaign_id || !url) {
      return res.status(400).json({ error: "campaign_id and url required" });
    }

    // Verify campaign exists
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Store evidence submission
    const { data, error } = await supabase
      .from('evidence_submissions')
      .insert({
        campaign_id,
        recipient_address,
        url,
        status: 'pending',
        verdict: null,
      })
      .select()
      .single();
    
    if (error) throw error;

    res.json({
      success: true,
      evidenceId: data.id,
      message: "Evidence submitted for review"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/evidence/:campaignId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evidence_submissions')
      .select('*')
      .eq('campaign_id', req.params.campaignId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Supabase connected: ${SUPABASE_URL}`);
  console.log(`✅ Contracts: Governance=${GOVERNANCE_ADDRESS}, Spending=${SPENDING_ADDRESS}`);
});
