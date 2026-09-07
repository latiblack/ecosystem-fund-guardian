import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function SubmitEvidence() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    campaignId: "",
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
    if (!form.campaignId || !form.recipient || !form.url) {
      showToast("All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.campaignId,
          recipient: form.recipient,
          url: form.url,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      showToast("Evidence submitted!");
      setTimeout(() => navigate(`/campaign/${form.campaignId}`), 1500);
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
      <h1 style={{ marginBottom: 24 }}>Submit Evidence</h1>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 600 }}>
        <div className="form-group">
          <label>Campaign ID *</label>
          <input
            placeholder="e.g. creator-marketing-sep2026"
            value={form.campaignId}
            onChange={update("campaignId")}
          />
        </div>

        <div className="form-group">
          <label>Recipient address *</label>
          <input
            placeholder="0x..."
            value={form.recipient}
            onChange={update("recipient")}
          />
        </div>

        <div className="form-group">
          <label>Evidence URL *</label>
          <input
            placeholder="https://x.com/user/status/..."
            value={form.url}
            onChange={update("url")}
          />
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
            URL to your deliverable — social media post, blog, GitHub PR, etc.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Submitting..." : "Submit Evidence"}
        </button>
      </form>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}
