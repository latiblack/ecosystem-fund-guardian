import { useState, useEffect, useMemo } from "react";
import { useSignMessage } from "wagmi";
import { useWallet } from "../context/WalletContext";
import { supabase } from "../lib/supabase";
import {
  Lock, Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight,
  Megaphone, Landmark, Code, Users, Calendar, Gift,
} from "lucide-react";

const CATEGORIES = [
  { id: "marketing", name: "Marketing Campaigns", icon: Megaphone, desc: "Verify paid campaigns, creator promotions, and marketing deliverables before releasing funds." },
  { id: "ecosystem", name: "Ecosystem Grants", icon: Landmark, desc: "Release grants based on verified milestones rather than sending the entire allocation upfront." },
  { id: "developer", name: "Developer Grants", icon: Code, desc: "Verify developers delivered agreed features, integrations, or open-source work before payment." },
  { id: "partnerships", name: "Partnerships", icon: Users, desc: "Tie partner payments to verifiable deliverables and agreed conditions." },
  { id: "events", name: "Event Sponsorships", icon: Calendar, desc: "Verify sponsored events delivered agreed exposure, appearances, and promotional commitments." },
  { id: "community", name: "Community Programs", icon: Gift, desc: "Automate rewards for ambassadors and community contributors based on verified activity." },
];

const RULE_TEMPLATES = {
  marketing: `This ecosystem fund is for marketing and promotional activities.\nApproved uses:\n- Creator content campaigns (social media, threads, videos)\n- Paid advertising and influencer partnerships\n- AMA sessions and community calls\n- Content localization and regional outreach\n\nNOT approved:\n- Team compensation or operational expenses\n- Token buybacks or market making\n- Direct token transfers without deliverable proof`,
  ecosystem: `This ecosystem fund is for growing the broader ecosystem through grants.\nApproved uses:\n- Developer grants tied to shipped milestones\n- Integration bounties for partner protocols\n- Ecosystem research and tooling\n- Open-source contributions with verified commits\n\nNOT approved:\n- Internal team salaries\n- Investments or token purchases\n- Grants without verifiable deliverables`,
  developer: `This ecosystem fund is for developer grants and technical contributions.\nApproved uses:\n- Feature development with merged pull requests\n- SDK and tooling contributions\n- Bug fixes and security audits\n- Documentation and developer tutorials\n\nNOT approved:\n- Non-technical work or marketing\n- Speculative research without deliverables\n- Recurring payments without milestone proof`,
  partnerships: `This ecosystem fund is for partnership-related payments.\nApproved uses:\n- Technical integrations with partner protocols\n- Co-marketing campaigns with verified deliverables\n- Joint product launches with proof of execution\n- Cross-protocol liquidity or collaboration incentives\n\nNOT approved:\n- Partnership payments without deliverable proof\n- Token swaps without clear mutual benefit\n- Advisory fees without measurable contributions`,
  events: `This ecosystem fund is for event sponsorships and conference presence.\nApproved uses:\n- Conference sponsorships with proof of brand visibility\n- Hackathon prizes with winning project verification\n- Community meetups with attendance proof\n- Speaking engagements and panel participation\n\nNOT approved:\n- Event sponsorships without exposure proof\n- Travel expenses without speaking deliverables\n- Entertainment or hospitality costs`,
  community: `This ecosystem fund is for community growth and ambassador programs.\nApproved uses:\n- Ambassador rewards with verified activity logs\n- Community moderator compensation with contribution proof\n- Translation and localization bounties\n- Community content creation with engagement metrics\n\nNOT approved:\n- Rewards without verifiable activity\n- Airdrops or giveaways without conditions\n- Payments to inactive or unverifiable contributors`,
};

// Tokens available per chain (keyed by wagmi chainId). The token select
// derives its options from the wallet's CURRENTLY CONNECTED chain.
const TOKENS_BY_CHAIN = {
  1: { // Ethereum Mainnet
    name: "Ethereum",
    tokens: [
      { symbol: "ETH", name: "Ethereum", type: "native" },
      { symbol: "USDC", name: "USD Coin", type: "erc20", address: "0xA0b86a33E6441E6C7636C8d5b0e2B3A5A0b0c0D1" },
      { symbol: "USDT", name: "Tether", type: "erc20", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
      { symbol: "DAI", name: "Dai", type: "erc20", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    ],
  },
  84532: { // Base Sepolia
    name: "Base Sepolia",
    tokens: [
      { symbol: "ETH", name: "Sepolia ETH", type: "native" },
    ],
  },
  11155111: { // Sepolia
    name: "Sepolia",
    tokens: [
      { symbol: "ETH", name: "Sepolia ETH", type: "native" },
    ],
  },
  137: { // Polygon
    name: "Polygon",
    tokens: [
      { symbol: "POL", name: "Polygon", type: "native" },
      { symbol: "USDC", name: "USD Coin (PoS)", type: "erc20", address: "0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359" },
    ],
  },
  56: { // BNB Smart Chain
    name: "BNB Smart Chain",
    tokens: [
      { symbol: "BNB", name: "BNB", type: "native" },
      { symbol: "USDT", name: "Tether", type: "erc20", address: "0x55d398326f99059fF775485246999027B3197955" },
    ],
  },
  42161: { // Arbitrum One
    name: "Arbitrum One",
    tokens: [
      { symbol: "ETH", name: "Ethereum", type: "native" },
      { symbol: "USDC", name: "USD Coin", type: "erc20", address: "0xaf88d063e77c58cF5355E955d5742a62416A742e" },
    ],
  },
  10: { // Optimism
    name: "Optimism",
    tokens: [
      { symbol: "ETH", name: "Ethereum", type: "native" },
      { symbol: "USDC", name: "USD Coin", type: "erc20", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" },
    ],
  },
  43114: { // Avalanche
    name: "Avalanche",
    tokens: [
      { symbol: "AVAX", name: "Avalanche", type: "native" },
      { symbol: "USDC", name: "USD Coin", type: "erc20", address: "0xB97EF9Ef8734C71904D8002B8E5Db697Ac20F6da" },
    ],
  },
};

export default function CreateCampaign() {
  const [step, setStep] = useState(1);
  const [project, setProject] = useState({ name: "", logo: "", description: "" });
  const [category, setCategory] = useState(null);
  const [fund, setFund] = useState({ token: "ETH", tokenAddress: "", amount: "", duration: 90, rules: "", recipients: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { address, chainId, isConnected } = useWallet();
  const { signMessageAsync } = useSignMessage();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Chain-aware token list: derive options from the wallet's connected chain.
  const chainInfo = chainId ? TOKENS_BY_CHAIN[chainId] : undefined;
  const tokenOptions = useMemo(
    () => chainInfo?.tokens ?? [],
    [chainInfo]
  );

  // If the user switches chains mid-flow, re-validate the selected token
  // so we never submit a token that doesn't exist on the new chain.
  useEffect(() => {
    if (!chainId) return;
    const valid = tokenOptions.some((t) => t.symbol === fund.token);
    if (!valid && tokenOptions.length > 0) {
      const first = tokenOptions[0];
      setFund((f) => ({
        ...f,
        token: first.symbol,
        tokenAddress: first.type === "erc20" ? first.address : "",
      }));
    }
  }, [chainId, tokenOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const signWithWallet = async (message) => {
    if (!address || !isConnected) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }
    return await signMessageAsync({ message });
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();
    if (!project.name) { showToast("Project name is required", "error"); return; }
    
    if (!isConnected) {
      showToast("Please connect your wallet first - click wallet icon in header", "error");
      return;
    }
    
    setLoading(true);
    try {
      const projectId = project.name.toLowerCase().replace(/\s+/g, "-");
      const message = JSON.stringify({ project_id: projectId, name: project.name });
      const signature = await signWithWallet(message);
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          id: projectId,
          name: project.name,
          description: project.description,
          logo_url: project.logo,
          creator_address: address,
          chain_id: chainId,
          created_at: new Date().toISOString(),
        }])
        .select();
      
      if (error) throw error;
      
      setStep(2);
      showToast("Project created successfully!");
    } catch (err) {
      showToast(err.message || "Failed to create project", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = (cat) => {
    setCategory(cat);
    setFund((f) => ({ ...f, rules: RULE_TEMPLATES[cat.id] || "" }));
    setStep(3);
  };

  const handleLockSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      showToast("Please connect your wallet to lock funds", "error");
      return;
    }
    
    if (!fund.token || !fund.amount || !fund.rules) {
      showToast("Token, amount, and spending rules are required", "error");
      return;
    }
    
    setLoading(true);
    try {
      const projectId = project.name.toLowerCase().replace(/\s+/g, "-");
      const campaignId = `${projectId}-${category.id}`;
      const message = JSON.stringify({ campaignId, project_id: projectId });
      const signature = await signWithWallet(message);
      
      const tokenInfo = tokenOptions.find(t => t.symbol === fund.token);
      if (!tokenInfo) {
        throw new Error("Selected token is not available on your connected chain. Please pick a token from the list.");
      }
      
      // Save campaign to Supabase
      const { error } = await supabase
        .from('campaigns')
        .insert([{
          id: campaignId,
          project_id: projectId,
          category: category.id,
          creator_address: address,
          signature,
          rules: fund.rules,
          max_per_recipient: "0",
          duration_days: Number(fund.duration) || 90,
          recipients: fund.recipients,
          token_address: tokenInfo.type === "erc20" ? tokenInfo.address : "native",
          token_symbol: tokenInfo.symbol,
          chain_id: chainId,
          created_at: new Date().toISOString(),
        }]);
      
      if (error) throw error;
      
      setStep(4);
      showToast("Fund locked successfully!");
    } catch (err) {
      showToast(err.message || "Failed to lock fund", "error");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Project", "Confirm", "Lock Fund"];

  if (!isConnected) {
    return null; // ProtectedRoute redirects to /auth
  }

  return (
    <div className="create-page">
      <a href="/" className="back-link"><ArrowLeft size={14} /> Back</a>

      <div className="wizard-steps">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`wizard-step${step === i + 1 ? " active" : ""}${step > i + 1 ? " completed" : ""}`}
          >
            <div className="wizard-step-num">
              {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Project Details */}
      {step === 1 && (
        <form onSubmit={handleProjectSave}>
          <div className="card">
            <h2>Create Your Project</h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 24, fontSize: 14 }}>
              Define what this fund is for. Your community will see every rule, every payment, every verdict — publicly, automatically.
            </p>

            <div className="form-group">
              <label>Project Name *</label>
              <input
                placeholder="e.g. Hyperliquid"
                value={project.name}
                onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Logo URL</label>
              <input
                placeholder="https://yourproject.com/logo.png"
                value={project.logo}
                onChange={(e) => setProject((p) => ({ ...p, logo: e.target.value }))}
              />
              <p className="form-hint">Direct link to your project logo image</p>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="What does your project do? Why does it exist?"
                value={project.description}
                onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Saving...</> : <><ArrowRight size={16} /> Next — Choose Category</>}
          </button>
        </form>
      )}

      {/* Step 2: Congratulatory */}
      {step === 2 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <CheckCircle2 size={56} style={{ color: "var(--accent)", marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>Project Created!</h2>
          <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20, marginBottom: 12 }}>{project.name}</p>
          <p style={{ color: "var(--text-dim)", marginBottom: 8, fontSize: 14 }}>
            {project.description || "Your project is ready."}
          </p>
          <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
            Now lock your ecosystem fund and define the spending rules your community will see.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
            Lock Funds <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 3: Lock Fund */}
      {step === 3 && (
        <form onSubmit={handleLockSubmit}>
          <div className="card">
            <h2>Lock Your Fund</h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 24, fontSize: 14 }}>
              Choose a category, then fill in the fund details below.
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 600, marginBottom: 10, color: "var(--text-dim)", letterSpacing: 1 }}>
                CHOOSE CATEGORY
              </label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-card${category?.id === cat.id ? " selected" : ""}`}
                      onClick={() => selectCategory(cat)}
                    >
                      <Icon size={24} className="icon-accent" />
                      <h3>{cat.name}</h3>
                      <p>{cat.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Token *</label>
                <p className="form-hint" style={{ marginBottom: 6 }}>
                  On {chainInfo ? chainInfo.name : "your connected network"}
                  {chainId ? ` (chain ${chainId})` : ""}
                </p>
                {tokenOptions.length === 0 ? (
                  <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                    No tokens listed for this chain yet — switch your wallet to
                    a supported network (e.g. Sepolia).
                  </p>
                ) : (
                  <select
                    value={fund.token}
                    onChange={(e) => {
                      const selected = tokenOptions.find(t => t.symbol === e.target.value);
                      setFund((f) => ({ 
                        ...f, 
                        token: e.target.value,
                        tokenAddress: selected?.address || ""
                      }));
                    }}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }}
                  >
                    {tokenOptions.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol} ({t.name})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Amount to Lock *</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={fund.amount}
                  onChange={(e) => setFund((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                value={fund.duration}
                onChange={(e) => setFund((f) => ({ ...f, duration: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Spending Rules *</label>
              <textarea
                value={fund.rules}
                onChange={(e) => setFund((f) => ({ ...f, rules: e.target.value }))}
                rows={12}
              />
              <p className="form-hint">These rules are enforced on-chain by GenLayer AI consensus</p>
            </div>

            <div className="form-group">
              <label>Authorized Recipients (wallet addresses, comma-separated)</label>
              <textarea
                placeholder="0xabc..., 0xdef..., 0x123..."
                value={fund.recipients}
                onChange={(e) => setFund((f) => ({ ...f, recipients: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Lock size={16} /> Lock Fund</>}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Final Success */}
      {step === 4 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <CheckCircle2 size={56} style={{ color: "var(--accent)", marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>Fund Locked Successfully</h2>
          <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{project.name}</p>
          <p style={{ color: "var(--text-dim)", marginBottom: 8 }}>{category?.name}</p>
          <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
            {fund.amount} {fund.token} locked for {fund.duration} days. Your community can now see every rule, payment, and verdict.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/explore" className="btn btn-primary">View Projects</a>
            <a href="/" className="btn btn-outline">Back Home</a>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
