import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Coins,
  ShieldCheck,
  ShieldX,
  Clock,
  ArrowRight,
  Loader2,
  Plus,
  Lock,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function Explore() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/campaigns`);
      const json = await res.json();
      setFunds(Array.isArray(json) ? json : []);
    } catch {
      setFunds([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = funds.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.id?.toLowerCase().includes(q) ||
      f.rules?.toLowerCase().includes(q) ||
      f.creator?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="explore-header">
        <div>
          <h1>Ecosystem Funds</h1>
          <p className="dim">
            Browse ecosystem funds locked by projects. Every disbursement is verified by AI consensus.
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Plus size={16} /> Lock Fund
        </Link>
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by fund name, rules, or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="empty-state">
          <Loader2 size={32} className="spin icon-dim" />
          <p>Loading funds...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <Coins size={48} className="icon-dim" />
          <h2>No funds found</h2>
          <p>{search ? "Try a different search term" : "Be the first to lock an ecosystem fund"}</p>
          {!search && (
            <Link to="/create" className="btn btn-primary" style={{ marginTop: 12 }}>
              <Lock size={16} /> Lock Your Fund
            </Link>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="fund-grid">
          {filtered.map((fund) => (
            <Link to={`/fund/${fund.id}`} key={fund.id} className="fund-card">
              <div className="fund-card-header">
                <h3>{fund.id}</h3>
                <span className={`badge ${fund.status}`}>{fund.status}</span>
              </div>
              <p className="fund-rules">
                {fund.rules?.length > 120 ? fund.rules.slice(0, 120) + "..." : fund.rules}
              </p>
              <div className="fund-meta">
                <span className="fund-meta-item">
                  <Clock size={12} /> {fund.duration_days} days
                </span>
                <span className="fund-meta-item">
                  Max: {fund.max_per_recipient || "—"}
                </span>
              </div>
              <div className="fund-card-footer">
                <span className="dim mono" style={{ fontSize: 11 }}>
                  {fund.creator?.slice(0, 8)}...{fund.creator?.slice(-6)}
                </span>
                <span className="fund-arrow">
                  View Audit <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
