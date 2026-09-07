import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    campaignId: "",
    rules: "",
    maxPerRecipient: "",
    durationDays: 30,
    requiredDeliverables: "",
    recipients: "",
    token: "",
    fundAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.campaignId || !form.rules) {
      showToast("Campaign ID and rules are required", "error");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create campaign on governance contract
      const res = await fetch(`${API}/api/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.campaignId,
          rules: form.rules,
          maxPerRecipient: form.maxPerRecipient || "0",
          durationDays: Number(form.durationDays) || 30,
          requiredDeliverables: form.requiredDeliverables,
          recipients: form.recipients,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      showToast("Campaign created!");
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
      <h1 style={{ marginBottom: 24 }}>Create Campaign</h1>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 700 }}>
        <div className="form-group">
          <label>Campaign ID *</label>
          <input
            placeholder="e.g. creator-marketing-sep2026"
            value={form.campaignId}
            onChange={update("campaignId")}
          />
        </div>

        <div className="form-group">
          <label>Rules (natural language) *</label>
          <textarea
            placeholder={`e.g.\nThis is a creator marketing campaign.\nEach creator must publish one social media post mentioning "ProjectX".\nThe post must contain the campaign hashtag #BuildWithX.\nThe post must be published during the campaign period.`}
            value={form.rules}
            onChange={update("rules")}
            rows={6}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label>Max per recipient</label>
            <input
              type="number"
              placeholder="e.g. 2000"
              value={form.maxPerRecipient}
              onChange={update("maxPerRecipient")}
            />
          </div>

          <div className="form-group">
            <label>Duration (days)</label>
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
            placeholder="e.g. 1 social media post with project mention"
            value={form.requiredDeliverables}
            onChange={update("requiredDeliverables")}
          />
        </div>

        <div className="form-group">
          <label>Approved recipients (comma-separated addresses)</label>
          <textarea
            placeholder="0xabc..., 0xdef..., 0x123..."
            value={form.recipients}
            onChange={update("recipients")}
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Campaign"}
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
