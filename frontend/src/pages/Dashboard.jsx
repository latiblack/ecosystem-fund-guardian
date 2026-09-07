import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShieldX,
  Lock,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fundId, setFundId] = useState(id || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verifying, setVerifying] = useState({});
  const [paying, setPaying] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDashboard = async () => {
    if (!fundId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/${fundId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) setFundId(id);
  }, [id]);

  useEffect(() => {
    if (fundId) loadDashboard();
  }, [fundId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (fundId) {
      navigate(`/fund/${fundId}`);
      loadDashboard();
    }
  };

  const handleVerify = async (recipient) => {
    const key = recipient.toLowerCase();
    setVerifying((v) => ({ ...v, [key]: true }));
    try {
      const res = await fetch(`${API}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: fundId, recipient }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast("Verification submitted — AI consensus may take 5-10 min");
      setTimeout(loadDashboard, 15000);
      setTimeout(loadDashboard, 30000);
      setTimeout(loadDashboard, 60000);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setVerifying((v) => ({ ...v, [key]: false }));
    }
  };

  const handlePay = async (recipient, amount) => {
    const key = recipient.toLowerCase();
    setPaying((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`${API}/api/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: fundId, recipient, amount }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast(`Disbursement of ${amount} released`);
      loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPaying((p) => ({ ...p, [key]: false }));
    }
  };

  const campaign = data?.campaign;
  const submissions = data?.submissions || [];
  const funds = data?.funds;

  const verifiedCount = submissions.filter((s) => s.status === "verified").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Ecosystem Fund Transparency</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
        Every rule, every disbursement, every verdict — visible to your community. No proof, funds stay locked.
      </p>

      {/* Fund selector */}
      <form onSubmit={handleSearch} className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by fund name..."
          value={fundId}
          onChange={(e) => setFundId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : "Audit"}
        </button>
      </form>

      {!campaign && !loading && (
        <div className="empty-state">
          <Lock size={48} className="icon-dim" />
          <h2>No Fund Selected</h2>
          <p>Search for a fund by name, or lock a new ecosystem fund.</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            Make Your Fund Transparent
          </Link>
        </div>
      )}

      {campaign && (
        <>
          {/* Compliance banner */}
          <div className={`compliance-banner ${rejectedCount > 0 ? "violations" : verifiedCount > 0 ? "compliant" : "pending"}`}>
            <div className="compliance-left">
              <h2>{campaign.id}</h2>
              <span className={`badge ${campaign.status}`}>{campaign.status}</span>
            </div>
            <div className="compliance-right">
              <div className="compliance-label">WHAT YOUR COMMUNITY SEES</div>
              <div className="compliance-value">
                {rejectedCount > 0 && <ShieldX size={20} />}
                {rejectedCount === 0 && verifiedCount > 0 && <ShieldCheck size={20} />}
                {rejectedCount === 0 && verifiedCount === 0 && <Clock size={20} />}
                {rejectedCount > 0 ? "VIOLATIONS DETECTED" : verifiedCount > 0 ? "COMPLIANT" : "PENDING REVIEW"}
              </div>
            </div>
          </div>

          {/* Fund stats */}
          <div className="stats">
            <div className="stat">
              <div className="label">Total Locked</div>
              <div className="value">{funds?.deposited || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Disbursed</div>
              <div className="value green">{funds?.spent || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Remaining</div>
              <div className="value">{funds?.remaining || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Verified</div>
              <div className="value green">{verifiedCount}</div>
            </div>
            <div className="stat">
              <div className="label">Rejected</div>
              <div className="value red">{rejectedCount}</div>
            </div>
            <div className="stat">
              <div className="label">Pending</div>
              <div className="value yellow">{pendingCount}</div>
            </div>
          </div>

          {/* Fund Policy */}
          <div className="card">
            <h2>Fund Policy</h2>
            <div className="policy-grid">
              <div>
                <h3>Spending Rules</h3>
                <div className="rules-box">{campaign.rules || "No rules defined"}</div>
              </div>
              <div>
                <h3>Parameters</h3>
                <div className="param-list">
                  <div className="param">
                    <span className="param-label">Max per disbursement</span>
                    <span className="param-value">{campaign.max_per_recipient || "Unlimited"}</span>
                  </div>
                  <div className="param">
                    <span className="param-label">Audit period</span>
                    <span className="param-value">{campaign.duration_days} days</span>
                  </div>
                  <div className="param">
                    <span className="param-label">Deliverables</span>
                    <span className="param-value">{campaign.required_deliverables || "None"}</span>
                  </div>
                  <div className="param">
                    <span className="param-label">Locked by</span>
                    <span className="param-value mono">{campaign.creator}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursement Audit Trail */}
          <div className="card">
            <h2>Audit Trail</h2>
            {submissions.length === 0 ? (
              <div className="empty-state small">
                <Coins size={32} className="icon-dim" />
                <p>No disbursement requests yet</p>
                <Link to="/submit" className="btn btn-outline" style={{ marginTop: 12 }}>
                  Submit Disbursement Request
                </Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Evidence</th>
                      <th>Status</th>
                      <th>Verdict</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.key}>
                        <td className="mono">{s.recipient}</td>
                        <td>
                          <a href={s.url} target="_blank" rel="noopener" className="link">
                            {s.url.length > 35 ? s.url.slice(0, 35) + "..." : s.url}
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td>
                          <span className={`badge ${s.status}`}>
                            {s.status === "verified" ? "VERIFIED" : s.status === "rejected" ? "REJECTED" : "PENDING"}
                          </span>
                        </td>
                        <td className="dim">{s.reason || "—"}</td>
                        <td>
                          {s.status === "pending" && (
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleVerify(s.recipient)}
                              disabled={verifying[s.recipient.toLowerCase()]}
                            >
                              {verifying[s.recipient.toLowerCase()] ? (
                                <><Loader2 size={12} className="spin" /> Verifying</>
                              ) : (
                                <><CheckCircle2 size={12} /> Verify</>
                              )}
                            </button>
                          )}
                          {s.status === "verified" && (
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handlePay(s.recipient, funds?.max_per_recipient || 0)}
                              disabled={paying[s.recipient.toLowerCase()]}
                            >
                              {paying[s.recipient.toLowerCase()] ? (
                                <><Loader2 size={12} className="spin" /> Releasing</>
                              ) : (
                                <><ArrowUpRight size={12} /> Release</>
                              )}
                            </button>
                          )}
                          {s.status === "rejected" && (
                            <span className="locked-label">
                              <Lock size={12} /> LOCKED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card how-it-works">
            <h2>How Fund Transparency Works</h2>
            <div className="steps-list">
              <div className="step-item"><span className="step-num">01</span> Project locks ecosystem tokens — your community can see the balance</div>
              <div className="step-item"><span className="step-num">02</span> Spending rules are stored on-chain in plain English — anyone can read them</div>
              <div className="step-item"><span className="step-num">03</span> Every disbursement comes with proof — a URL to the deliverable</div>
              <div className="step-item"><span className="step-num">04</span> AI consensus reads the proof and verifies it against the rules</div>
              <div className="step-item"><span className="step-num">05</span> Only verified disbursements get paid — your community sees every verdict</div>
            </div>
          </div>
        </>
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
