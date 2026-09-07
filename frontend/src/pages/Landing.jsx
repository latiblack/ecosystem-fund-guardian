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
          Projects lie about
          <br />
          <span className="gradient-text">ecosystem spending.</span>
        </h1>
        <h1 className="hero-sub">
          Our tool makes it
          <br />
          <span className="gradient-text-green">impossible.</span>
        </h1>
        <p className="hero-desc">
          Lock your ecosystem funds. Define spending rules in plain English.
          Every disbursement requires AI-verified proof.
          No proof — funds stay locked.
        </p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </Link>
          <Link to="/explore" className="btn btn-outline btn-lg">
            View Audit Dashboard
          </Link>
        </div>
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
        <h2>One contract governs another.</h2>
        <p className="section-desc">
          A <strong>Governance Contract</strong> defines the spending rules.
          A <strong>Spending Contract</strong> holds the funds.
          The Spending Contract cannot pay without the Governance Contract's permission.
        </p>

        <div className="flow">
          <div className="flow-step">
            <div className="flow-num"><Lock size={16} /></div>
            <div className="flow-content">
              <h3>Lock</h3>
              <p>Project deposits ecosystem tokens into a governed Spending Contract</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><FileCheck size={16} /></div>
            <div className="flow-content">
              <h3>Define Rules</h3>
              <p>Governance Contract stores what the funds can be used for — in natural language</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><Coins size={16} /></div>
            <div className="flow-content">
              <h3>Request Disbursement</h3>
              <p>Recipient submits evidence URL — proof of deliverable</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step highlight">
            <div className="flow-num"><Eye size={16} /></div>
            <div className="flow-content">
              <h3>AI Verifies</h3>
              <p>AI consensus reads the URL and evaluates it against the spending rules</p>
            </div>
          </div>
          <div className="flow-arrow"><ArrowDown size={16} /></div>
          <div className="flow-step">
            <div className="flow-num"><CheckCircle2 size={16} /></div>
            <div className="flow-content">
              <h3>Release or Lock</h3>
              <p>Verified — funds released. Rejected — funds stay locked. No exceptions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Feature */}
      <section className="section">
        <div className="section-label">WHY THIS WORKS</div>
        <h2>The rules are written in English.<br />The enforcement is automatic.</h2>
        <p className="section-desc">
          No simple smart contract can read a URL, understand what it contains,
          and judge whether it meets natural language requirements.
          AI consensus can. That's what makes this tool possible.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <FileCheck size={20} className="icon-accent" />
            <h3>Natural Language Rules</h3>
            <p>Define spending rules in plain English. No code needed. "Marketing campaigns only — not team compensation."</p>
          </div>
          <div className="feature-card">
            <Eye size={20} className="icon-accent" />
            <h3>AI-Powered Verification</h3>
            <p>AI consensus reads the submitted evidence and evaluates it against the rules. Trustless, decentralized.</p>
          </div>
          <div className="feature-card">
            <Lock size={20} className="icon-accent" />
            <h3>Contract Governance</h3>
            <p>One contract governs another. The Spending Contract cannot pay without the Governance Contract's permission.</p>
          </div>
          <div className="feature-card">
            <ShieldAlert size={20} className="icon-accent" />
            <h3>Public Audit Trail</h3>
            <p>Every disbursement, every verdict, every outcome — visible on a public dashboard. Community can audit everything.</p>
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
            <p>Verify that paid campaigns, creator promotions, and marketing deliverables were actually completed before releasing funds.</p>
          </div>
          <div className="usecase-card">
            <Landmark size={20} className="icon-accent" />
            <h3>Ecosystem Grants</h3>
            <p>Release grants based on verified milestones rather than sending the entire allocation upfront.</p>
          </div>
          <div className="usecase-card">
            <Code size={20} className="icon-accent" />
            <h3>Developer Grants</h3>
            <p>Verify that developers delivered agreed features, integrations, or open-source work before subsequent payments.</p>
          </div>
          <div className="usecase-card">
            <Users size={20} className="icon-accent" />
            <h3>Partnerships</h3>
            <p>Tie partner payments to verifiable deliverables and agreed conditions.</p>
          </div>
          <div className="usecase-card">
            <Calendar size={20} className="icon-accent" />
            <h3>Event Sponsorships</h3>
            <p>Verify that sponsored events delivered agreed exposure, appearances, speaking slots, or promotional commitments.</p>
          </div>
          <div className="usecase-card">
            <Gift size={20} className="icon-accent" />
            <h3>Community Programs</h3>
            <p>Automate rewards for ambassadors, community contributors, and other growth programs based on verified activity.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Stop trusting.<br />Start verifying.</h2>
        <p>Lock your ecosystem fund. Define the rules. Let AI enforce them.</p>
        <div className="hero-actions">
          <Link to="/create" className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>Ecosystem Fund Guardian</p>
        <p className="footer-sub">One contract governs another. AI consensus verifies everything.</p>
      </footer>
    </div>
  );
}
