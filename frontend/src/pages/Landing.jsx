import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { supabase } from "../lib/supabase";
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
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleLockFund = () => {
    navigate("/auth?next=/create");
  };

  const handleExplore = () => {
    navigate("/auth?next=/explore");
  };

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-image-wrap">
          <picture>
            <source media="(max-width: 640px)" type="image/avif" srcSet="/hero-400.avif" />
            <source type="image/avif" srcSet="/hero.avif" />
            <source media="(max-width: 640px)" type="image/webp" srcSet="/hero-400.webp" />
            <source type="image/webp" srcSet="/hero.webp" />
            <img src="/hero.png" alt="Ecosystem Fund Guardian" className="hero-image" width="800" height="800" fetchPriority="high" />
          </picture>
        </div>
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
          <button onClick={handleLockFund} className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </button>
          <button onClick={handleExplore} className="btn btn-outline btn-lg">
            Explore Funds
          </button>
        </div>
      </section>

      {/* Projects Section - Only show if connected */}
      {isConnected && projects.length > 0 && (
        <section className="projects-section">
          <h2>Recent Projects</h2>
          <div className="projects-grid">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.description?.slice(0, 100)}...</p>
                <div className="project-meta">
                  <Coins size={14} />
                  <span>{project.amount} {project.token}</span>
                </div>
              </div>
            ))}
          </div>
          <a href="/explore" className="btn btn-outline">View All Projects</a>
        </section>
      )}

      {/* Powered by GenLayer */}
      <section className="genlayer-section">
        <div className="genlayer-divider-top" />
        <div className="genlayer-content">
          <div className="genlayer-logo-wrap">
            <img src="/genlayer-logo.jpeg" alt="GenLayer" className="genlayer-logo" />
          </div>
          <div className="genlayer-text">
            <h3>Powered by GenLayer</h3>
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
          <span className="genlayer-highlight">Powered by GenLayer</span> — the only blockchain where smart contracts can read URLs, understand natural language, and reach AI consensus on-chain.
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

      {/* CTA */}
      <section className="cta-section">
        <h2>Start proving.<br />Stop hoping.</h2>
        <p>Lock your ecosystem fund. Define the rules. Let GenLayer verify every payment for your community.</p>
        <div className="hero-actions">
          <button onClick={handleLockFund} className="btn btn-primary btn-lg">
            Lock Your Fund <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-powered">
          <img src="/genlayer-logo.jpeg" alt="GenLayer" className="footer-logo" />
          <span>Powered by GenLayer</span>
        </div>
      </footer>
    </div>
  );
}
