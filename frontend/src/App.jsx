import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Shield, Wallet } from "lucide-react";
import { WalletProvider, useWallet } from "./context/WalletContext";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import ProjectDetail from "./pages/ProjectDetail";
import CreateCampaign from "./pages/CreateCampaign";
import SubmitEvidence from "./pages/SubmitEvidence";
import "./index.css";

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { address, connecting, connect, disconnect } = useWallet();

  const close = () => setOpen(false);

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={close}>
        <Shield size={18} />
        <span>EFG</span>
      </Link>

      <button className="menu-toggle" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`nav-links ${open ? "open" : ""}`}>
        <Link to="/explore" onClick={close}>Explore</Link>
        <Link to="/create" onClick={close}>Lock Fund</Link>
        <Link to="/submit" onClick={close}>Submit Proof</Link>

        {shortAddr ? (
          <button className="btn btn-wallet btn-connected" onClick={disconnect}>
            <Wallet size={14} />
            <span>{shortAddr}</span>
          </button>
        ) : (
          <button className="btn btn-wallet" onClick={connect} disabled={connecting}>
            <Wallet size={14} />
            <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/submit" element={<SubmitEvidence />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}
