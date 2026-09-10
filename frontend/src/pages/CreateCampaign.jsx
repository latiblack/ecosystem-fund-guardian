import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import {
  Lock, Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight,
  Megaphone, Landmark, Code, Users, Calendar, Gift,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

const CATEGORIES = [
  { id: "marketing", name: "Marketing Campaigns", icon: Megaphone, desc: "Verify paid campaigns, creator promotions, and marketing deliverables before releasing funds." },
  { id: "ecosystem", name: "Ecosystem Grants", icon: Landmark, desc: "Release grants based on verified milestones rather than sending the entire allocation upfront." },
  { id: "developer", name: "Developer Grants", icon: Code, desc: "Verify developers delivered agreed features, integrations, or open-source work before payment." },
  { id: "partnerships", name: "Partnerships", icon: Users, desc: "Tie partner payments to verifiable deliverables and agreed conditions." },
  { id: "events", name: "Event Sponsorships", icon: Calendar, desc: "Verify sponsored events delivered agreed exposure, appearances, and promotional commitments." },
  { id: "community", name: "Community Programs", icon: Gift, desc: "Automate rewards for ambassadors and community contributors based on verified activity." },
];

const RULE_TEMPLATES = {
  marketing: `This ecosystem fund is for marketing and promotional activities.
Approved uses:
- Creator content campaigns (social media, threads, videos)
- Paid advertising and influencer partnerships
- AMA sessions and community calls
- Content localization and regional outreach

NOT approved:
- Team compensation or operational expenses
- Token buybacks or market making
- Direct token transfers without deliverable proof`,

  ecosystem: `This ecosystem fund is for growing the broader ecosystem through grants.
Approved uses:
- Developer grants tied to shipped milestones
- Integration bounties for partner protocols
- Ecosystem research and tooling
- Open-source contributions with verified commits

NOT approved:
- Internal team salaries
- Investments or token purchases
- Grants without verifiable deliverables`,

  developer: `This ecosystem fund is for developer grants and technical contributions.
Approved uses:
- Feature development with merged pull requests
- SDK and tooling contributions
- Bug fixes and security audits
- Documentation and developer tutorials

NOT approved:
- Non-technical work or marketing
- Speculative research without deliverables
- Recurring payments without milestone proof`,

  partnerships: `This ecosystem fund is for partnership-related payments.
Approved uses:
- Technical integrations with partner protocols
- Co-marketing campaigns with verified deliverables
- Joint product launches with proof of execution
- Cross-protocol liquidity or collaboration incentives

NOT approved:
- Partnership payments without deliverable proof
- Token swaps without clear mutual benefit
- Advisory fees without measurable contributions`,

  events: `This ecosystem fund is for event sponsorships and conference presence.
Approved uses:
- Conference sponsorships with proof of brand visibility
- Hackathon prizes with winning project verification
- Community meetups with attendance proof
- Speaking engagements and panel participation

NOT approved:
- Event sponsorships without exposure proof
- Travel expenses without speaking deliverables
- Entertainment or hospitality costs`,

  community: `This ecosystem fund is for community growth and ambassador programs.
Approved uses:
- Ambassador rewards with verified activity logs
- Community moderator compensation with contribution proof
- Translation and localization bounties
- Community content creation with engagement metrics

NOT approved:
- Rewards without verifiable activity
- Airdrops or giveaways without conditions
- Payments to inactive or unverifiable contributors`,
};

export default function CreateCampaign() {
  const [step, setStep] = useState(1);
  const [project, setProject] = useState({ name: "", logo: "", description: "", chain: "GenLayer" });
  const [category, setCategory] = useState(null);
  const [fund, setFund] = useState({ token: "", amount: "", duration: 90, rules: "", recipients: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { address, connect } = useWallet();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const signWithWallet = async (message) => {
    if (!window.ethereum || !address) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }
    // Verify it's an EVM-compatible chain (any valid chainId is acceptable)
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    if (isNaN(chainId) || chainId < 1) {
      throw new Error("Please connect to an EVM-compatible network.");
    }
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });
    return signature;
  };

  const waitForConnection = async () => {
    if (address) return true;
    await connect();
    // Wait up to 10 seconds for the user to complete connection
    return new Promise((resolve) => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (address) {
          clearInterval(interval);
          resolve(true);
        } else if (checks > 20) {
          clearInterval(interval);
          resolve(false);
        }
      }, 500);
    });
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();
    if (!project.name) { showToast("Project name is required", "error"); return; }
    const connected = await waitForConnection();
    if (!connected) { showToast("Please connect your wallet to continue", "error"); return; }
    setLoading(true);
    try {
      const projectId = project.name.toLowerCase().replace(/\s+/g, "-");
      const message = JSON.stringify({ project_id: projectId, name: project.name });
      const signature = await signWithWallet(message);
      const res = await fetch(`${API}/api/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          name: project.name,
          description: project.description,
          chain: project.chain,
          logo_url: project.logo,
          creator: address,
          signature,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStep(2);
    } catch (err) {
      showToast(err.message, "error");
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
    const connected = await waitForConnection();
    if (!connected) { showToast("Please connect your wallet to lock funds", "error"); return; }
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
      const res = await fetch(`${API}/api/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          project_id: projectId,
          creator: address,
          signature,
          rules: fund.rules,
          maxPerRecipient: "0",
          durationDays: Number(fund.duration) || 90,
          recipients: fund.recipients,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStep(4);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Project", "Confirm", "Lock Fund"];

  return (
    <div>
      <Link to="/" className="back-link"><ArrowLeft size={14} /> Back</Link>

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

            <div className="form-group">
              <label>Network</label>
              <input
                value={project.chain}
                onChange={(e) => setProject((p) => ({ ...p, chain: e.target.value }))}
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
                <label>Token</label>
                <input
                  placeholder="e.g. USDC, ETH, HYPE"
                  value={fund.token}
                  onChange={(e) => setFund((f) => ({ ...f, token: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Amount to Lock</label>
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
              <label>Spending Rules</label>
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
              {loading ? <><Loader2 size={16} className="spin" /> Locking...</> : <><Lock size={16} /> Lock Fund</>}
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
            <Link to="/explore" className="btn btn-primary">View Projects</Link>
            <Link to="/" className="btn btn-outline">Back Home</Link>
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
