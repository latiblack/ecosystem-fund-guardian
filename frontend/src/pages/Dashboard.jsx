import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
      showToast(`Disbursement of ${amount} released to ${recipient}`);
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
      <h1 style={{ marginBottom: 8 }}>Ecosystem Fund Audit</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24, fontSize: 14 }}>
        Transparent, AI-verified ecosystem fund accountability. Every disbursement requires proof. No proof = funds stay locked.
      </p>

      {/* Fund selector */}
      <form onSubmit={handleSearch} className="campaign-selector">
        <input
          type="text"
          placeholder="Enter ecosystem fund ID to audit..."
          value={fundId}
          onChange={(e) => setFundId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Loading..." : "Audit Fund"}
        </button>
      </form>

      {!campaign && !loading && (
        <div className="empty">
          <h2 style={{ marginBottom: 12 }}>No Fund Selected</h2>
          <p>Enter a fund ID to view its audit trail, or lock a new ecosystem fund.</p>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            <a href="/create" style={{ color: "var(--accent)" }}>Lock Ecosystem Fund →</a>
          </p>
        </div>
      )}

      {campaign && (
        <>
          {/* Compliance banner */}
          <div className="card" style={{
            borderColor: rejectedCount > 0 ? "var(--red)" : verifiedCount > 0 ? "var(--green)" : "var(--border)",
            borderWidth: 2,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ marginBottom: 4 }}>
                  {campaign.id}
                </h2>
                <span className={`badge ${campaign.status}`}>{campaign.status}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase" }}>Compliance Status</div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: rejectedCount > 0 ? "var(--red)" : verifiedCount > 0 ? "var(--green)" : "var(--yellow)",
                }}>
                  {rejectedCount > 0 ? "VIOLATIONS DETECTED" : verifiedCount > 0 ? "COMPLIANT" : "PENDING REVIEW"}
                </div>
              </div>
            </div>
          </div>

          {/* Fund stats */}
          <div className="stats">
            <div className="stat">
              <div className="label">Total Fund Locked</div>
              <div className="value">{funds?.deposited || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Disbursed</div>
              <div className="value green">{funds?.spent || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Remaining (Locked)</div>
              <div className="value">{funds?.remaining || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Verified Disbursements</div>
              <div className="value green">{verifiedCount}</div>
            </div>
            <div className="stat">
              <div className="label">Rejected (No Proof)</div>
              <div className="value red">{rejectedCount}</div>
            </div>
            <div className="stat">
              <div className="label">Awaiting Verification</div>
              <div className="value yellow">{pendingCount}</div>
            </div>
          </div>

          {/* Fund Policy */}
          <div className="card">
            <h2>Fund Policy (Governance Rules)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <h3>Approved Spending Rules</h3>
                <div className="rules-box">{campaign.rules || "No rules defined"}</div>
              </div>
              <div>
                <h3>Fund Parameters</h3>
                <div style={{ fontSize: 14, lineHeight: 2 }}>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Max per disbursement: </span>
                    <strong>{campaign.max_per_recipient || "Unlimited"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Audit period: </span>
                    <strong>{campaign.duration_days} days</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Required deliverables: </span>
                    {campaign.required_deliverables || "None specified"}
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Locked by: </span>
                    <span style={{ fontSize: 12, wordBreak: "break-all", fontFamily: "monospace" }}>
                      {campaign.creator}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursement Audit Trail */}
          <div className="card">
            <h2>Disbursement Audit Trail</h2>
            {submissions.length === 0 ? (
              <div className="empty">
                <p>No disbursement requests yet</p>
                <p style={{ marginTop: 12, fontSize: 13 }}>
                  <a href="/submit" style={{ color: "var(--accent)" }}>Submit a disbursement request →</a>
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Evidence (URL)</th>
                    <th>Verification</th>
                    <th>AI Verdict</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.key}>
                      <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                        {s.recipient}
                      </td>
                      <td>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener"
                          style={{ color: "var(--accent)", fontSize: 13 }}
                        >
                          {s.url.length > 40 ? s.url.slice(0, 40) + "..." : s.url}
                        </a>
                      </td>
                      <td>
                        <span className={`badge ${s.status}`}>
                          {s.status === "verified" ? "PROOF ACCEPTED" : s.status === "rejected" ? "PROOF REJECTED" : "AWAITING PROOF"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-dim)", maxWidth: 200 }}>
                        {s.reason || "—"}
                      </td>
                      <td>
                        {s.status === "pending" && (
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handleVerify(s.recipient)}
                            disabled={verifying[s.recipient.toLowerCase()]}
                          >
                            {verifying[s.recipient.toLowerCase()] ? "Verifying..." : "Verify Proof"}
                          </button>
                        )}
                        {s.status === "verified" && (
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handlePay(s.recipient, funds?.max_per_recipient || 0)}
                            disabled={paying[s.recipient.toLowerCase()]}
                            style={{ background: "var(--green)" }}
                          >
                            {paying[s.recipient.toLowerCase()] ? "Releasing..." : "Release Funds"}
                          </button>
                        )}
                        {s.status === "rejected" && (
                          <span style={{ color: "var(--red)", fontSize: 13, fontWeight: 600 }}>
                            FUNDS LOCKED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* How it works */}
          <div className="card" style={{ borderColor: "var(--accent)" }}>
            <h2>How Fund Governance Works</h2>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-dim)" }}>
              <p><strong>1. Lock:</strong> Project deposits ecosystem tokens into a governed Spending Contract.</p>
              <p><strong>2. Rules:</strong> A Governance Contract defines what the funds can be used for (natural language).</p>
              <p><strong>3. Proof:</strong> Every disbursement requires verifiable evidence of deliverables.</p>
              <p><strong>4. Verify:</strong> AI consensus reads the evidence and evaluates it against the rules.</p>
              <p><strong>5. Release:</strong> Only verified disbursements get paid. No proof = funds stay locked.</p>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}
