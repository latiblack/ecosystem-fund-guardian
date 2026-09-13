import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  Layers,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { supabase, getUserProjects, updateProject } from "../lib/supabase";

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

const CHAIN_OPTIONS = Object.entries(CHAIN_NAMES).map(([id, name]) => ({
  id: Number(id),
  name,
}));

const LINKS = [
  { key: "website", label: "Website" },
  { key: "twitter", label: "Twitter / X" },
  { key: "telegram", label: "Telegram" },
  { key: "discord", label: "Discord" },
];

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!address) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getUserProjects(address);
        setProjects(data || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
        showToast("Failed to load your projects", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (project) => {
    setEditingId(project.id);
    setDraft({
      name: project.name || "",
      logo_url: project.logo_url || "",
      description: project.description || "",
      website: project.website || "",
      twitter: project.twitter || "",
      telegram: project.telegram || "",
      discord: project.discord || "",
      chain_id: project.chain_id || null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const updated = await updateProject(id, draft);
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setEditingId(null);
      setDraft(null);
      showToast("Project details updated");
    } catch (err) {
      showToast(err.message || "Failed to update project", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
        Manage your project details. Funds and rules are managed separately on each project page.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <Layers size={48} className="icon-dim" />
          <h2>No Projects Yet</h2>
          <p>Create your first transparent ecosystem fund.</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="dash-project-list">
          {projects.map((project) => {
            const isEditing = editingId === project.id;
            const campaigns = project.campaigns || [];
            const totalLocked = campaigns.reduce(
              (s, c) => s + (parseFloat(c.total_locked) || 0),
              0
            );

            return (
              <div className="card dash-project-card" key={project.id}>
                <div className="dash-project-header">
                  {project.logo_url ? (
                    <img
                      src={project.logo_url}
                      alt={project.name}
                      className="project-logo-img"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="project-logo">
                      {(project.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ marginBottom: 2 }}>
                      <Link to={`/project/${project.id}`} style={{ color: "inherit" }}>
                        {project.name}
                      </Link>
                    </h2>
                    <div className="dash-project-meta">
                      <span className="badge">
                        {CHAIN_NAMES[project.chain_id] || "Unknown Chain"}
                      </span>
                      <span className="badge">{campaigns.length} fund{campaigns.length === 1 ? "" : "s"}</span>
                      {totalLocked > 0 && (
                        <span className="badge">
                          {totalLocked.toLocaleString()} locked
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/project/${project.id}`}
                    className="btn btn-outline btn-small"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={12} /> View
                  </a>
                </div>

                {isEditing ? (
                  <div className="dash-edit-form" style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label>Project Name *</label>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Logo URL</label>
                      <input
                        value={draft.logo_url}
                        onChange={(e) => setDraft((d) => ({ ...d, logo_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={draft.description}
                        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Chain</label>
                      <select
                        value={draft.chain_id || ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, chain_id: e.target.value ? Number(e.target.value) : null }))
                        }
                        style={{ width: "100%", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }}
                      >
                        <option value="">Select chain</option>
                        {CHAIN_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-row">
                      {LINKS.slice(0, 2).map((l) => (
                        <div className="form-group" key={l.key}>
                          <label>{l.label}</label>
                          <input
                            value={draft[l.key] || ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [l.key]: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      ))}
                    </div>
                    <div className="form-row">
                      {LINKS.slice(2).map((l) => (
                        <div className="form-group" key={l.key}>
                          <label>{l.label}</label>
                          <input
                            value={draft[l.key] || ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [l.key]: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleSave(project.id)}
                        disabled={saving}
                      >
                        {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save</>}
                      </button>
                      <button className="btn btn-outline btn-small" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dash-project-details" style={{ marginTop: 12 }}>
                    <p className="dim" style={{ margin: 0, fontSize: 13 }}>
                      {project.description || "No description provided."}
                    </p>
                    <div className="dash-link-row">
                      {LINKS.filter((l) => project[l.key]).map((l) => (
                        <a
                          key={l.key}
                          href={project[l.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                    <button
                      className="btn btn-outline btn-small"
                      style={{ marginTop: 10 }}
                      onClick={() => startEdit(project)}
                    >
                      <Pencil size={12} /> Edit Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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