import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Eye,
  Lock,
  FileCheck,
  Coins,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Landmark,
  Users,
  Gift,
  Megaphone,
  ChevronRight,
  Code,
  Calendar,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <h1>
          Prove your ecosystem
          <br />
          <span className="gradient-text">funds are used right.</span>
        </h1>
        <h1 className="hero-sub">
          Every token accounted for.
          <br />
          <span className="gradient-text-green">Publicly. Automatically.</span>
        </h1>
        <p className="hero-desc">
          Lock your ecosystem funds. Define spending rules in plain English.
          GenLayer's AI consensus verifies every disbursement on-chain.
          Your community sees exactly where the money goes.
        </p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </Link>
          <Link to="/explore" className="btn btn-outline btn-lg">
            Explore Funds
          </Link>
        </div>
      </section>

      {/* Powered by GenLayer */}
      <section className="genlayer-section">
        <div className="genlayer-divider-top" />
        <div className="genlayer-content">
          <div className="genlayer-logo-wrap">
            <img src="/genlayer-logo.jpeg" alt="GenLayer" className="genlayer-logo" />
          </div>
          <div className="genlayer-text">
            <h3>Powered by GenLayer</h3>
            <p>
              The only blockchain where smart contracts can read URLs, understand natural language,
              and reach AI consensus on-chain. GenLayer validators verify every disbursement
              against your spending rules — automatically.
            </p>
          </div>
        </div>
        <div className="genlayer-divider-bottom" />
      </section>

      {/* Problem */}
      <section className="section">
        <div className="section-label">THE PROBLEM</div>
        <h2>20% for ecosystem.*</h2>
        <p className="asterisk">*terms and conditions may not exist</p>
        <div className="problem-grid">
          <div className="problem-card">
            <Coins size={24} className="icon-accent" />
            <h3>Projects announce tokenomics</h3>
            <p>"20% of supply goes to ecosystem fund for community growth"</p>
          </div>
          <div className="problem-card">
            <ShieldAlert size={24} className="icon-red" />
            <h3>Team quietly drains the fund</h3>
            <p>No audit trail. No verification. The community can't see where the money goes.</p>
          </div>
          <div className="problem-card">
            <Eye size={24} className="icon-dim" />
            <h3>Community has to trust blindly</h3>
            <p>There's no way to confirm the ecosystem fund is being used as promised.</p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section">
        <div className="section-label">THE SOLUTION</div>
        <h2>Your community sees every token.</h2>
        <p className="section-desc">
          A <strong>Governance Contract</strong> defines the spending rules.
          A <strong>Spending Contract</strong> holds the funds.
          The Spending Contract cannot pay without the Governance Contract's permission.
          Every rule, every payment, every verdict — visible to your community.
          <br /><br />
          <span className="genlayer-highlight">Powered by GenLayer</span> — the only blockchain where smart contracts
          can read URLs, understand natural language, and reach AI consensus on-chain.
        </p>

        <div className="flow">
          <div className="flow-step">
            <div className="flow-num"><Lock size={16} /></div>
            <div className="flow-content">
              <h3>Lock</h3>
              <p>The project locks ecosystem tokens. Your community can see the balance and the rules.</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><FileCheck size={16} /></div>
            <div className="flow-content">
              <h3>Define Rules</h3>
              <p>Spending rules are stored on-chain in plain English. Anyone can read them.</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><Coins size={16} /></div>
            <div className="flow-content">
              <h3>Request Disbursement</h3>
              <p>Each disbursement comes with proof — a URL to the deliverable.</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step highlight">
            <div className="flow-num"><Eye size={16} /></div>
            <div className="flow-content">
              <h3>GenLayer Verifies</h3>
              <p>GenLayer's AI consensus reads the proof and checks it against the rules. Decentralized, on-chain.</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><CheckCircle2 size={16} /></div>
            <div className="flow-content">
              <h3>Release or Lock</h3>
              <p>Verified — funds released. Rejected — funds stay locked. Your community sees both.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Feature */}
      <section className="section">
        <div className="section-label">WHY THIS WORKS</div>
        <h2>The rules are public.<br />The enforcement is automatic.<br />Your community sees everything.</h2>
        <p className="section-desc">
          No simple smart contract can read a URL, understand what it contains,
          and judge whether it meets natural language requirements.
          GenLayer's AI consensus can. That's what makes transparent ecosystem spending possible.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <FileCheck size={20} className="icon-accent" />
            <h3>Natural Language Rules</h3>
            <p>Define spending rules in plain English. No code needed. Your community can read and understand every rule.</p>
          </div>
          <div className="feature-card">
            <Eye size={20} className="icon-accent" />
            <h3>GenLayer AI Consensus</h3>
            <p>GenLayer validators reach consensus on evidence using AI — reading URLs, evaluating proofs, and enforcing rules on-chain.</p>
          </div>
          <div className="feature-card">
            <Lock size={20} className="icon-accent" />
            <h3>Contract Governance</h3>
            <p>One contract governs another. The Spending Contract cannot pay without the Governance Contract's permission. No team override.</p>
          </div>
          <div className="feature-card">
            <ShieldAlert size={20} className="icon-accent" />
            <h3>Public Audit Trail</h3>
            <p>Every disbursement, every verdict, every outcome — visible to your community. No hidden wallets. No off-chain deals.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section">
        <div className="section-label">USE CASES</div>
        <h2>Any fund. Any project. Any token.</h2>
        <div className="usecase-grid">
          <div className="usecase-card">
            <Megaphone size={20} className="icon-accent" />
            <h3>Marketing Campaigns</h3>
            <p>Show your community that marketing funds went to real campaigns and creator promotions — not sitting in a wallet.</p>
          </div>
          <div className="usecase-card">
            <Landmark size={20} className="icon-accent" />
            <h3>Ecosystem Grants</h3>
            <p>Prove to your community that grants were released for completed milestones — not handed out in bulk with no accountability.</p>
          </div>
          <div className="usecase-card">
            <Code size={20} className="icon-accent" />
            <h3>Developer Grants</h3>
            <p>Show your community that developer payments matched actual delivered features, integrations, and open-source contributions.</p>
          </div>
          <div className="usecase-card">
            <Users size={20} className="icon-accent" />
            <h3>Partnerships</h3>
            <p>Make partner payments transparent to your community — tied to what was actually delivered, not just a handshake.</p>
          </div>
          <div className="usecase-card">
            <Calendar size={20} className="icon-accent" />
            <h3>Event Sponsorships</h3>
            <p>Prove to your community that sponsorship budgets went to events that actually delivered the promised exposure.</p>
          </div>
          <div className="usecase-card">
            <Gift size={20} className="icon-accent" />
            <h3>Community Programs</h3>
            <p>Show your community that ambassadors and contributors were rewarded for real activity — not just connections.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="genlayer-logo-wrap" style={{ marginBottom: 16 }}>
          <img src="/genlayer-logo.jpeg" alt="GenLayer" className="genlayer-logo" />
        </div>
        <h2>Start proving.<br />Stop hoping.</h2>
        <p>Lock your ecosystem fund. Define the rules. Let GenLayer verify every payment for your community.</p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>Ecosystem Fund Guardian</p>
        <p className="footer-sub">Powered by GenLayer. One contract governs another. Every payment is visible to your community.</p>
      </footer>
    </div>
  );
}
