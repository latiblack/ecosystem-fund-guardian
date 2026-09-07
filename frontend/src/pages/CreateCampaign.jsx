import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fundId: "",
    project: "",
    rules: "",
    maxPerDisbursement: "",
    durationDays: 90,
    requiredDeliverables: "",
    authorizedRecipients: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fundId || !form.rules) {
      showToast("Fund ID and spending rules are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.fundId,
          rules: form.rules,
          maxPerRecipient: form.maxPerDisbursement || "0",
          durationDays: Number(form.durationDays) || 90,
          requiredDeliverables: form.requiredDeliverables,
          recipients: form.authorizedRecipients,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      showToast("Ecosystem fund locked with governance rules!");
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
      <h1 style={{ marginBottom: 8 }}>Lock Ecosystem Fund</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 14 }}>
        Define what your ecosystem fund can be used for. Every future disbursement will be verified against these rules by AI consensus.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Fund ID</label>
          <input
            placeholder="e.g. projectx-ecosystem-q4-2026"
            value={form.fundId}
            onChange={update("fundId")}
          />
        </div>

        <div className="form-group">
          <label>Project Name</label>
          <input
            placeholder="e.g. ProjectX"
            value={form.project}
            onChange={update("project")}
          />
        </div>

        <div className="form-group">
          <label>Spending Rules — what this fund can be used for</label>
          <textarea
            placeholder={"e.g.\nThis ecosystem fund is for growing the ProjectX community.\nApproved uses:\n- Marketing campaigns (creator content, social media, AMAs)\n- Developer grants and hackathon prizes\n- Community bounties and rewards\n\nNOT approved:\n- Team compensation\n- Operational expenses\n- Token buybacks"}
            value={form.rules}
            onChange={update("rules")}
            rows={8}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Max per disbursement</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={form.maxPerDisbursement}
              onChange={update("maxPerDisbursement")}
            />
          </div>
          <div className="form-group">
            <label>Audit period (days)</label>
            <input
              type="number"
              value={form.durationDays}
              onChange={update("durationDays")}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Required deliverables</label>
          <input
            placeholder="e.g. Proof of deliverable (URL to content, report, or work product)"
            value={form.requiredDeliverables}
            onChange={update("requiredDeliverables")}
          />
        </div>

        <div className="form-group">
          <label>Authorized recipients (wallet addresses, comma-separated)</label>
          <textarea
            placeholder="0xabc..., 0xdef..., 0x123..."
            value={form.authorizedRecipients}
            onChange={update("authorizedRecipients")}
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Locking...</> : <><Lock size={16} /> Lock Ecosystem Fund</>}
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
