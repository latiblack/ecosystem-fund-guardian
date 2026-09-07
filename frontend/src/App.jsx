import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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
            🛡️ Ecosystem Fund Guardian
          </Link>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/create">Create Campaign</Link>
            <Link to="/submit">Submit Evidence</Link>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/submit" element={<SubmitEvidence />} />
            <Route path="/campaign/:id" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
