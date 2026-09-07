import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import SubmitEvidence from "./pages/SubmitEvidence";
import "./index.css";

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = () => setOpen(false);

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
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/submit" element={<SubmitEvidence />} />
            <Route path="/fund/:id" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
