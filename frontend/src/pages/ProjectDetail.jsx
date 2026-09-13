import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  ShieldX,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
} from "lucide-react";
import { FaXTwitter, FaTelegram, FaDiscord, FaGlobe } from "react-icons/fa6";
import { supabase, getProjectById } from "../lib/supabase";
import { useWallet } from "../context/WalletContext";

const CHAIN_NAMES = {
  1: "Ethereum",
  84532: "Base Sepolia",
  11155111: "Sepolia",
  137: "Polygon",
  56: "BNB Chain",
  42161: "Arbitrum",
  10: "Optimism",
  43114: "Avalanche",
};

function chainName(chainId) {
  if (!chainId) return "Unknown Chain";
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

function shortAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedFund, setExpandedFund] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getProjectById(id);
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setProject(data);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Loader2 size={32} className="spin" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="empty-state">
        <Layers size={48} className="icon-dim" />
        <h2>Project Not Found</h2>
        <p>This project doesn't exist or is no longer available.</p>
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Explore
        </Link>
      </div>
    );
  }

  const campaigns = project.campaigns || [];
  const isCreator =
    isConnected &&
    address &&
    project.creator_address &&
    address.toLowerCase() === project.creator_address.toLowerCase();

  const totalLocked = campaigns.reduce(
    (s, c) => s + (parseFloat(c.total_locked) || 0),
    0
  );
  const primaryToken = campaigns[0]?.token_symbol || "TOKEN";

  const links = [
    { key: "website", label: "Website", icon: FaGlobe },
    { key: "twitter", label: "Twitter / X", icon: FaXTwitter },
    { key: "telegram", label: "Telegram", icon: FaTelegram },
    { key: "discord", label: "Discord", icon: FaDiscord },
  ].filter((l) => project[l.key]);

  return (
    <div>
      <Link to="/explore" className="back-link">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      {/* Project Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          {project.logo_url ? (
            <img
              src={project.logo_url}
              alt={project.name}
              className="project-logo project-logo-lg project-logo-img"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="project-logo project-logo-lg">
              {(project.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1>{project.name}</h1>
            <div className="detail-meta">
              <span className="badge">{chainName(project.chain_id)}</span>
              {campaigns.length > 0 && (
                <span className="badge">{primaryToken}</span>
              )}
              <span className="badge">
                By {project.creator_address ? shortAddr(project.creator_address) : "Unknown"}
              </span>
            </div>
            <p className="detail-description">
              {project.description || "No description provided."}
            </p>

            {links.length > 0 && (
              <div className="social-links">
                {links.map((l) => {
                  const Icon = l.icon;
                  return (
                    <a
                      key={l.key}
                      href={project[l.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <Icon size={14} /> {l.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCreator && campaigns.length === 0 && (
        <div className="card creator-lock-cta">
          <div>
            <h2 style={{ marginBottom: 4 }}>No funds locked yet</h2>
            <p style={{ color: "var(--text-dim)", fontSize: 14, margin: 0 }}>
              Lock your first fund to set spending rules your community can audit.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/create?project=${encodeURIComponent(project.id)}`)}
          >
            <Lock size={16} /> Lock Funds
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="stats">
        <div className="stat">
          <div className="label">Total Locked</div>
          <div className="value">
            {totalLocked > 0 ? `${totalLocked.toLocaleString()} ${primaryToken}` : "0"}
          </div>
        </div>
        <div className="stat">
          <div className="label">Campaigns</div>
          <div className="value accent">{campaigns.length}</div>
        </div>
        <div className="stat">
          <div className="label">Chain</div>
          <div className="value">{chainName(project.chain_id)}</div>
        </div>
        <div className="stat">
          <div className="label">Status</div>
          <div className="value green">
            {campaigns.length > 0 ? "Funded" : "No Funds"}
          </div>
        </div>
      </div>

      {/* Campaigns / Funds */}
      <div className="card">
        <h2>Locked Funds ({campaigns.length})</h2>
        <p className="dim" style={{ marginBottom: 20, fontSize: 13 }}>
          {campaigns.length === 0
            ? "No funds locked yet. The creator can lock a fund to set rules, budget, and audit trail."
            : "Each fund has its own rules, budget, and audit trail. Click to expand."}
        </p>

        {campaigns.length === 0 ? (
          <div className="empty-state small">
            <Lock size={32} className="icon-dim" />
            <p>No disbursement requests yet</p>
          </div>
        ) : (
          <div className="fund-list">
            {campaigns.map((campaign, i) => {
              const isExpanded = expandedFund === i;
              const locked = parseFloat(campaign.total_locked) || 0;
              return (
                <div key={campaign.id} className={`fund-item ${isExpanded ? "expanded" : ""}`}>
                  <button
                    className="fund-item-header"
                    onClick={() => setExpandedFund(isExpanded ? null : i)}
                  >
                    <div className="fund-item-left">
                      <Lock size={16} className="icon-accent" />
                      <div>
                        <h3>{campaign.category}</h3>
                        <span className="dim" style={{ fontSize: 12 }}>
                          {campaign.token_symbol || "TOKEN"} · {campaign.duration_days || 90} days
                        </span>
                      </div>
                    </div>
                    <div className="fund-item-right">
                      <span className={`badge ${campaign.status || "active"}`}>
                        {campaign.status || "active"}
                      </span>
                      <span className="dim">{locked.toLocaleString()} {campaign.token_symbol || ""}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="fund-item-body">
                      <div className="fund-detail-stats">
                        <div className="fund-detail-stat">
                          <span className="label">Category</span>
                          <span className="value">{campaign.category}</span>
                        </div>
                        <div className="fund-detail-stat">
                          <span className="label">Token</span>
                          <span className="value">{campaign.token_symbol || "—"}</span>
                        </div>
                        <div className="fund-detail-stat">
                          <span className="label">Total Locked</span>
                          <span className="value accent">
                            {(parseFloat(campaign.total_locked) || 0).toLocaleString()}{" "}
                            {campaign.token_symbol || ""}
                          </span>
                        </div>
                        <div className="fund-detail-stat">
                          <span className="label">Duration</span>
                          <span className="value">{campaign.duration_days || 90} days</span>
                        </div>
                      </div>

                      {/* Spending Rules */}
                      <div style={{ marginTop: 16 }}>
                        <h3 style={{ marginBottom: 8, fontSize: 13, color: "var(--text-dim)" }}>
                          SPENDING RULES
                        </h3>
                        <div className="rules-box">
                          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                            {campaign.rules || "No rules defined."}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community can see everything */}
      <div className="card how-it-works">
        <h2>What Your Community Sees</h2>
        <div className="steps-list">
          <div className="step-item">
            <span className="step-num">01</span>
            Every rule is stored on-chain in plain English — anyone can read them
          </div>
          <div className="step-item">
            <span className="step-num">02</span>
            Every disbursement comes with proof — a URL to the deliverable
          </div>
          <div className="step-item">
            <span className="step-num">03</span>
            AI consensus verifies the proof against the rules — decentralized
          </div>
          <div className="step-item">
            <span className="step-num">04</span>
            Every verdict is public — verified, rejected, or pending
          </div>
          <div className="step-item">
            <span className="step-num">05</span>
            No team override — funds stay locked until proof is accepted
          </div>
        </div>
      </div>
    </div>
  );
}