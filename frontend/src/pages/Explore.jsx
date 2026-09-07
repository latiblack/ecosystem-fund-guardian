import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Lock,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";

export default function Explore() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_PROJECTS.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="explore-header">
        <div>
          <h1>Ecosystem Funds</h1>
          <p className="dim">
            Browse projects with locked ecosystem funds. Every disbursement is publicly verified by AI consensus.
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Lock size={16} /> Lock Fund
        </Link>
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by project name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats bar */}
      <div className="explore-stats">
        <div className="explore-stat">
          <span className="explore-stat-value">{SAMPLE_PROJECTS.length}</span>
          <span className="explore-stat-label">Projects</span>
        </div>
        <div className="explore-stat">
          <span className="explore-stat-value">
            {SAMPLE_PROJECTS.reduce((s, p) => s + p.fundCount, 0)}
          </span>
          <span className="explore-stat-label">Active Funds</span>
        </div>
        <div className="explore-stat">
          <span className="explore-stat-value">
            ${SAMPLE_PROJECTS.reduce((s, p) => s + parseFloat(p.totalLocked.replace(/,/g, "")), 0).toLocaleString()}
          </span>
          <span className="explore-stat-label">Total Locked</span>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Search size={48} className="icon-dim" />
          <h2>No projects found</h2>
          <p>Try a different search term</p>
        </div>
      )}

      <div className="project-grid">
        {filtered.map((project) => (
          <Link to={`/project/${project.id}`} key={project.id} className="project-card">
            <div className="project-card-header">
              <div className="project-logo">{project.logo}</div>
              <div className="project-info">
                <h3>{project.name}</h3>
                <span className="project-chain">{project.chain}</span>
              </div>
              <span className={`badge ${project.status}`}>{project.status}</span>
            </div>

            <p className="project-tagline">{project.tagline}</p>
            <p className="project-desc">{project.description}</p>

            <div className="project-stats">
              <div className="project-stat">
                <Lock size={12} className="icon-dim" />
                <span className="project-stat-value">{project.totalLocked}</span>
                <span className="project-stat-label">{project.token} locked</span>
              </div>
              <div className="project-stat">
                <TrendingUp size={12} className="icon-accent" />
                <span className="project-stat-value accent">{project.disbursed}</span>
                <span className="project-stat-label">disbursed</span>
              </div>
              <div className="project-stat">
                <ShieldCheck size={12} className="icon-dim" />
                <span className="project-stat-value">{project.fundCount}</span>
                <span className="project-stat-label">funds</span>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="project-progress">
              <div className="project-progress-bar">
                <div
                  className="project-progress-fill"
                  style={{
                    width: `${(parseFloat(project.disbursed.replace(/,/g, "")) / parseFloat(project.totalLocked.replace(/,/g, ""))) * 100}%`,
                  }}
                />
              </div>
              <span className="project-progress-label">
                {Math.round((parseFloat(project.disbursed.replace(/,/g, "")) / parseFloat(project.totalLocked.replace(/,/g, ""))) * 100)}% disbursed
              </span>
            </div>

            <div className="project-card-footer">
              <span className="dim">{project.rules.length} spending rules</span>
              <span className="project-arrow">
                View Details <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
