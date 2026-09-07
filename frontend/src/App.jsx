import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import SubmitEvidence from "./pages/SubmitEvidence";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="logo">
            ��️ Ecosystem Fund Guardian
          </Link>
          <div className="nav-links">
            <Link to="/audit">Audit Dashboard</Link>
            <Link to="/create">Lock Fund</Link>
            <Link to="/submit">Request Disbursement</Link>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/audit" element={<Dashboard />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/submit" element={<SubmitEvidence />} />
            <Route path="/fund/:id" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
