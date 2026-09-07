import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaignId, setCampaignId] = useState(id || "");
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
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/${campaignId}`);
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
    if (id) {
      setCampaignId(id);
    }
  }, [id]);

  useEffect(() => {
    if (campaignId) loadDashboard();
  }, [campaignId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (campaignId) {
      navigate(`/campaign/${campaignId}`);
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
        body: JSON.stringify({ campaignId, recipient }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast("Verification submitted — may take 5-10 min");
      // Poll for result
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
        body: JSON.stringify({ campaignId, recipient, amount }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast(`Paid ${amount} to ${recipient}`);
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
      <h1 style={{ marginBottom: 24 }}>Ecosystem Fund Guardian</h1>

      {/* Campaign selector */}
      <form onSubmit={handleSearch} className="campaign-selector">
        <input
          type="text"
          placeholder="Enter campaign ID..."
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </form>

      {!campaign && !loading && (
        <div className="empty">
          <p>Enter a campaign ID to view its dashboard</p>
          <p style={{ marginTop: 12, fontSize: 13 }}>
            Or{" "}
            <a href="/create" style={{ color: "var(--accent)" }}>
              create a new campaign
            </a>
          </p>
        </div>
      )}

      {campaign && (
        <>
          {/* Stats */}
          <div className="stats">
            <div className="stat">
              <div className="label">Budget</div>
              <div className="value">{funds?.deposited || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Spent</div>
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

          {/* Campaign info */}
          <div className="card">
            <h2>Campaign: {campaign.id}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <h3>Rules</h3>
                <div className="rules-box">{campaign.rules || "No rules set"}</div>
              </div>
              <div>
                <h3>Details</h3>
                <div style={{ fontSize: 14, lineHeight: 2 }}>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Status: </span>
                    <span className={`badge ${campaign.status}`}>{campaign.status}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Max per recipient: </span>
                    {campaign.max_per_recipient}
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Duration: </span>
                    {campaign.duration_days} days
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Deliverables: </span>
                    {campaign.required_deliverables || "None specified"}
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)" }}>Creator: </span>
                    <span style={{ fontSize: 12, wordBreak: "break-all" }}>
                      {campaign.creator}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions table */}
          <div className="card">
            <h2>Submissions</h2>
            {submissions.length === 0 ? (
              <div className="empty">
                <p>No submissions yet</p>
                <p style={{ marginTop: 12, fontSize: 13 }}>
                  <a href="/submit" style={{ color: "var(--accent)" }}>
                    Submit evidence
                  </a>
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Evidence URL</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
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
                        <span className={`badge ${s.status}`}>{s.status}</span>
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
                            {verifying[s.recipient.toLowerCase()]
                              ? "Verifying..."
                              : "Verify"}
                          </button>
                        )}
                        {s.status === "verified" && (
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() =>
                              handlePay(s.recipient, funds?.max_per_recipient || 0)
                            }
                            disabled={paying[s.recipient.toLowerCase()]}
                            style={{ background: "var(--green)" }}
                          >
                            {paying[s.recipient.toLowerCase()] ? "Paying..." : "Pay"}
                          </button>
                        )}
                        {s.status === "rejected" && (
                          <span style={{ color: "var(--red)", fontSize: 13 }}>
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}
