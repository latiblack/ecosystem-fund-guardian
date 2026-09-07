import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Lock,
  TrendingUp,
  ShieldCheck,
  ShieldX,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import { SAMPLE_PROJECTS } from "../data/sampleProjects";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = SAMPLE_PROJECTS.find((p) => p.id === id);
  const [expandedFund, setExpandedFund] = useState(null);

  if (!project) {
    return (
      <div className="empty-state">
        <Lock size={48} className="icon-dim" />
        <h2>Project Not Found</h2>
        <p>This project doesn't exist in the sample data.</p>
        <Link to="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Explore
        </Link>
      </div>
    );
  }

  const totalVerified = project.funds.reduce((s, f) => s + f.verified, 0);
  const totalRejected = project.funds.reduce((s, f) => s + f.rejected, 0);
  const totalPending = project.funds.reduce((s, f) => s + f.pending, 0);

  return (
    <div>
      <Link to="/explore" className="back-link">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      {/* Project Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="project-logo project-logo-lg">{project.logo}</div>
          <div>
          <h1>{project.name}</h1>
          <div className="detail-meta">
            <span className="badge">{project.chain}</span>
            <span className="badge">{project.token}</span>
            <span className={`badge ${project.status}`}>{project.status}</span>
          </div>
          <p className="detail-description">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats">
        <div className="stat">
          <div className="label">Total Locked</div>
          <div className="value">{project.totalLocked}</div>
        </div>
        <div className="stat">
          <div className="label">Disbursed</div>
          <div className="value accent">{project.disbursed}</div>
        </div>
        <div className="stat">
          <div className="label">Remaining</div>
          <div className="value">{project.remaining}</div>
        </div>
        <div className="stat">
          <div className="label">Verified</div>
          <div className="value green">{totalVerified}</div>
        </div>
        <div className="stat">
          <div className="label">Rejected</div>
          <div className="value red">{totalRejected}</div>
        </div>
        <div className="stat">
          <div className="label">Pending</div>
          <div className="value yellow">{totalPending}</div>
        </div>
      </div>

      {/* Spending Rules */}
      <div className="card">
        <h2>Spending Rules</h2>
        <div className="rules-box">
          <ul className="rules-list">
            {project.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Funds */}
      <div className="card">
        <h2>Locked Funds ({project.fundCount})</h2>
        <p className="dim" style={{ marginBottom: 20, fontSize: 13 }}>
          Each fund has its own rules, budget, and audit trail. Click to expand.
        </p>

        <div className="fund-list">
          {project.funds.map((fund, i) => {
            const isExpanded = expandedFund === i;
            const pct = Math.round(
              (parseFloat(fund.disbursed.replace(/,/g, "")) /
                parseFloat(fund.locked.replace(/,/g, ""))) *
                100
            );

            return (
              <div key={i} className={`fund-item ${isExpanded ? "expanded" : ""}`}>
                <button
                  className="fund-item-header"
                  onClick={() => setExpandedFund(isExpanded ? null : i)}
                >
                  <div className="fund-item-left">
                    <Lock size={16} className="icon-accent" />
                    <div>
                      <h3>{fund.name}</h3>
                      <span className="dim" style={{ fontSize: 12 }}>
                        {fund.locked} {project.token} locked · Max {fund.maxPer} per disbursement
                      </span>
                    </div>
                  </div>
                  <div className="fund-item-right">
                    <div className="fund-mini-stats">
                      <span className="fund-mini green"><CheckCircle2 size={10} /> {fund.verified}</span>
                      <span className="fund-mini red"><XCircle size={10} /> {fund.rejected}</span>
                      <span className="fund-mini yellow"><Clock size={10} /> {fund.pending}</span>
                    </div>
                    <div className="fund-progress-mini">
                      <div className="fund-progress-bar-mini">
                        <div
                          className="fund-progress-fill-mini"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="dim" style={{ fontSize: 11 }}>{pct}%</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="fund-item-body">
                    <div className="fund-detail-stats">
                      <div className="fund-detail-stat">
                        <span className="label">Locked</span>
                        <span className="value">{fund.locked} {project.token}</span>
                      </div>
                      <div className="fund-detail-stat">
                        <span className="label">Disbursed</span>
                        <span className="value accent">{fund.disbursed} {project.token}</span>
                      </div>
                      <div className="fund-detail-stat">
                        <span className="label">Remaining</span>
                        <span className="value">{fund.remaining} {project.token}</span>
                      </div>
                      <div className="fund-detail-stat">
                        <span className="label">Duration</span>
                        <span className="value">{fund.duration} days</span>
                      </div>
                    </div>

                    {/* Submissions Table */}
                    {fund.submissions.length > 0 ? (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Recipient</th>
                              <th>Evidence</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Verdict</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fund.submissions.map((s, j) => (
                              <tr key={j}>
                                <td className="mono">{s.recipient}</td>
                                <td>
                                  <a href={s.url} target="_blank" rel="noopener" className="link">
                                    {s.url.length > 30 ? s.url.slice(0, 30) + "..." : s.url}
                                    <ExternalLink size={12} />
                                  </a>
                                </td>
                                <td>{s.amount}</td>
                                <td>
                                  <span className={`badge ${s.status}`}>
                                    {s.status === "verified" ? "VERIFIED" : s.status === "rejected" ? "REJECTED" : "PENDING"}
                                  </span>
                                </td>
                                <td className="dim" style={{ maxWidth: 200 }}>{s.verdict || "—"}</td>
                                <td className="dim">{s.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state small">
                        <p>No disbursement requests yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Community can see everything */}
      <div className="card how-it-works">
        <h2>What Your Community Sees</h2>
        <div className="steps-list">
          <div className="step-item">
            <span className="step-num">01</span>
            Every rule is stored on-chain in plain English — anyone can read them
          </div>
          <div className="step-item">
            <span className="step-num">02</span>
            Every disbursement comes with proof — a URL to the deliverable
          </div>
          <div className="step-item">
            <span className="step-num">03</span>
            AI consensus verifies the proof against the rules — decentralized
          </div>
          <div className="step-item">
            <span className="step-num">04</span>
            Every verdict is public — verified, rejected, or pending
          </div>
          <div className="step-item">
            <span className="step-num">05</span>
            No team override — funds stay locked until proof is accepted
          </div>
        </div>
      </div>
    </div>
  );
}
