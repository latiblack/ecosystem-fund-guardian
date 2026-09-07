import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Lock,
  TrendingUp,
  ShieldCheck,
  Layers,
  DollarSign,
} from "lucide-react";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";

export default function Explore() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_PROJECTS.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.chain.toLowerCase().includes(q)
    );
  });

  const totalFunds = SAMPLE_PROJECTS.reduce((s, p) => s + p.fundCount, 0);
  const totalLocked = SAMPLE_PROJECTS.reduce(
    (s, p) => s + parseFloat(p.totalLocked.replace(/,/g, "")),
    0
  );

  return (
    <div>
      <div className="explore-header">
        <div>
          <h1>Ecosystem Funds</h1>
          <p className="dim">
            Browse projects with locked ecosystem funds. Every disbursement is publicly verified.
          </p>
        </div>
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
          <div className="explore-stat-icon"><Layers size={18} /></div>
          <div className="explore-stat-content">
            <span className="explore-stat-value">{SAMPLE_PROJECTS.length}</span>
            <span className="explore-stat-label">Projects</span>
          </div>
        </div>
        <div className="explore-stat">
          <div className="explore-stat-icon"><Lock size={18} /></div>
          <div className="explore-stat-content">
            <span className="explore-stat-value">{totalFunds}</span>
            <span className="explore-stat-label">Active Funds</span>
          </div>
        </div>
        <div className="explore-stat">
          <div className="explore-stat-icon"><DollarSign size={18} /></div>
          <div className="explore-stat-content">
            <span className="explore-stat-value">${(totalLocked / 1e6).toFixed(1)}M</span>
            <span className="explore-stat-label">Total Locked</span>
          </div>
        </div>
        <div className="explore-stat">
          <div className="explore-stat-icon"><ShieldCheck size={18} /></div>
          <div className="explore-stat-content">
            <span className="explore-stat-value">
              {SAMPLE_PROJECTS.reduce(
                (s, p) => s + p.funds.reduce((fs, f) => fs + f.verified, 0),
                0
              )}
            </span>
            <span className="explore-stat-label">Verified</span>
          </div>
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

            <div className="project-tags">
              {project.tags.map((tag, i) => (
                <span key={i} className={`tag tag-${i % 4}`}>{tag}</span>
              ))}
            </div>

            <div className="project-stats">
              <div className="project-stat">
                <Lock size={12} className="icon-dim" />
                <span className="project-stat-value">{project.totalLocked}</span>
                <span className="project-stat-label">{project.token}</span>
              </div>
              <div className="project-stat">
                <TrendingUp size={12} className="icon-accent" />
                <span className="project-stat-value accent">{project.disbursed}</span>
                <span className="project-stat-label">out</span>
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
              <span className="dim">{project.fundCount} funds</span>
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
