import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Send, Loader2, CheckCircle2, XCircle, ArrowLeft, ExternalLink } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function SubmitEvidence() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fundId: "",
    recipient: "",
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fundId || !form.recipient || !form.url) {
      showToast("All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.fundId,
          recipient: form.recipient,
          url: form.url,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      showToast("Disbursement request submitted with evidence!");
      setTimeout(() => navigate(`/fund/${form.fundId}`), 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div>
      <Link to="/" className="back-link"><ArrowLeft size={14} /> Back</Link>
      <h1 style={{ marginBottom: 8 }}>Request Disbursement</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
        Submit evidence of your deliverable. AI consensus will verify it against the fund's spending rules.
        Funds are only released if the proof is accepted.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Ecosystem Fund ID</label>
          <input
            placeholder="e.g. projectx-ecosystem-q4-2026"
            value={form.fundId}
            onChange={update("fundId")}
          />
        </div>

        <div className="form-group">
          <label>Recipient Wallet Address</label>
          <input
            placeholder="0x..."
            value={form.recipient}
            onChange={update("recipient")}
          />
        </div>

        <div className="form-group">
          <label>Evidence URL</label>
          <input
            placeholder="https://..."
            value={form.url}
            onChange={update("url")}
          />
          <p className="form-hint">
            URL to proof of your deliverable — social media post, blog, GitHub PR, report, etc.
            AI consensus will read this and verify it matches the fund's rules.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="spin" /> Submitting...</>
          ) : (
            <><Send size={16} /> Submit Disbursement Request</>
          )}
        </button>
      </form>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
