import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, getAllProjects } from "../lib/supabase";
import { Search, Loader2, Coins, ArrowUpRight, Layers, Lock } from "lucide-react";
import { FaXTwitter, FaTelegram, FaDiscord, FaGlobe } from "react-icons/fa6";

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

const CHAIN_COLORS = {
  1: "#627EEA",
  84532: "#F7931A",
  11155111: "#8A9BB0",
  137: "#8247E5",
  56: "#F0B90B",
  42161: "#28A0F0",
  10: "#FF0420",
  43114: "#E84142",
};

function chainColor(chainId) {
  return CHAIN_COLORS[chainId] || "#d4ff00";
}

// Project links shown as icon + name. Icons come from react-icons/fa6 so we get
// the current brand marks (FaXTwitter is the new X logo, not the old bird).
const PROJECT_LINKS = [
  { key: "website", label: "Website", Icon: FaGlobe },
  { key: "twitter", label: "Twitter / X", Icon: FaXTwitter },
  { key: "telegram", label: "Telegram", Icon: FaTelegram },
  { key: "discord", label: "Discord", Icon: FaDiscord },
];

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Metrics
  const allCampaigns = projects.flatMap((p) => p.campaigns || []);
  const totalLocked = allCampaigns.reduce(
    (s, c) => s + (parseFloat(c.total_locked) || 0),
    0
  );
  const totalFunds = allCampaigns.length;
  const capped = [...new Set(allCampaigns.map((c) => c.token_symbol).filter(Boolean))];
  const tokenLabel = capped.length === 1 ? capped[0] : "TOKENS";

  return (
    <div className="explore-page">
      <div className="explore-metrics">
        <div className="explore-metric">
          <Layers size={18} className="icon-accent" />
          <div>
            <div className="explore-metric-value">{projects.length}</div>
            <div className="explore-metric-label">Projects</div>
          </div>
        </div>
        <div className="explore-metric">
          <Lock size={18} className="icon-accent" />
          <div>
            <div className="explore-metric-value">
              {totalLocked > 0 ? totalLocked.toLocaleString() : "0"} {tokenLabel}
            </div>
            <div className="explore-metric-label">Total Locked</div>
          </div>
        </div>
        <div className="explore-metric">
          <Coins size={18} className="icon-accent" />
          <div>
            <div className="explore-metric-value">{totalFunds}</div>
            <div className="explore-metric-label">Locked Funds</div>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <Coins size={48} className="icon-dim" />
          <h2>No Projects Found</h2>
          <p>Be the first to create a transparent ecosystem fund!</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project, idx) => {
            const initial = (project.name || "?").charAt(0).toUpperCase();
            const creator = project.creator_address || "";
            const campaigns = project.campaigns || [];
            const totalLocked = campaigns.reduce(
              (s, c) => s + (parseFloat(c.total_locked) || 0),
              0
            );
            const tokenLabel =
              campaigns.length > 0 && campaigns[0]?.token_symbol
                ? campaigns[0].token_symbol
                : "";
            const chain = chainName(project.chain_id);
            const color = chainColor(project.chain_id);

            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="project-card"
                style={{ "--chain-color": color }}
              >
                <div className="project-card-top">
                  <span className="project-index">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="project-arrow">
                    <ArrowUpRight size={14} />
                  </span>
                </div>

                <div className="project-card-header">
                  {project.logo_url ? (
                    <img
                      src={project.logo_url}
                      alt={project.name}
                      className="project-logo-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="project-logo">{initial}</div>
                  )}
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <span
                      className="project-chain"
                      style={{ "--chain-color": color }}
                    >
                      <span
                        className="project-chain-dot"
                        style={{ background: color }}
                      />
                      {chain}
                    </span>
                  </div>
                </div>

                <p className="project-desc">
                  {project.description || "No description provided."}
                </p>

                {(() => {
                  const active = PROJECT_LINKS.filter((l) => project[l.key]);
                  if (active.length === 0) return null;
                  return (
                    <div className="project-links">
                      {active.map(({ key, label, Icon }) => (
                        <span
                          key={key}
                          className="project-link"
                          role="link"
                          tabIndex={0}
                          title={label}
                          onClick={(e) => {
                            // The whole card is a <Link>; stop it from
                            // hijacking this click, then open the URL.
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(project[key], "_blank", "noopener,noreferrer");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(project[key], "_blank", "noopener,noreferrer");
                            }
                          }}
                        >
                          <Icon size={12} />
                          <span>{label}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}

                <div className="project-stats-row">
                  <div className="project-stat-chip">
                    <span className="project-stat-chip-label">FUNDS</span>
                    <span className="project-stat-chip-value">
                      {campaigns.length}
                    </span>
                  </div>
                  <div className="project-stat-chip">
                    <span className="project-stat-chip-label">LOCKED</span>
                    <span className="project-stat-chip-value accent">
                      {totalLocked > 0
                        ? totalLocked.toLocaleString()
                        : "0"}{" "}
                      {tokenLabel}
                    </span>
                  </div>
                </div>

                <div className="project-card-footer">
                  <span className="project-stat-label">
                    By{" "}
                    {creator
                      ? `${creator.slice(0, 6)}...${creator.slice(-4)}`
                      : "Unknown"}
                  </span>
                  <span className="project-view-label">View Project</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
