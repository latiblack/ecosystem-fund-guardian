import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, getAllProjects } from "../lib/supabase";
import { Search, Loader2, Coins, ArrowUpRight } from "lucide-react";

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

  return (
    <div className="explore-page">
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
          {filteredProjects.map((project) => {
            const initial = (project.name || "?").charAt(0).toUpperCase();
            const creator = project.creator_address || "";
            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="project-card"
              >
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
                    <div className="project-chain">
                      {chainName(project.chain_id)}
                    </div>
                  </div>
                </div>

                <p className="project-desc">
                  {project.description || "No description provided."}
                </p>

                <div className="project-card-footer">
                  <span className="project-stat-label">
                    By {creator ? `${creator.slice(0, 6)}…${creator.slice(-4)}` : "Unknown"}
                  </span>
                  <span className="project-arrow">
                    View <ArrowUpRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
