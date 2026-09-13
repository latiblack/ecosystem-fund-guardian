import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia } from "wagmi/chains";
import { RainbowKitProvider, ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useState } from "react";
import { Menu, X, Loader2 } from "lucide-react";
import WalletProvider, { useWallet } from "./context/WalletContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import ProjectDetail from "./pages/ProjectDetail";
import CreateCampaign from "./pages/CreateCampaign";
import SubmitEvidence from "./pages/SubmitEvidence";
import Dashboard from "./pages/Dashboard";
import "./index.css";

// Create wagmi config
const chains = [mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia];

const { connectors } = getDefaultWallets({
  appName: "Ecosystem Fund Guardian",
  projectId: "7dbda9b31e7da7cb396ca5a5ae2f668e",
  chains,
});

const config = createConfig({
  chains: chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
  },
  connectors,
  // Standard client-side SPA persistence: the connector session is written to
  // localStorage and restored automatically on the next visit, so a returning
  // user stays connected until they explicitly disconnect their wallet.
  storage: createStorage({ storage: window.localStorage }),
  ssr: false,
});

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { isConnected, isReconnecting } = useWallet();
  const location = useLocation();
  // wagmi is rehydrating the persisted connection from localStorage. Wait for it
  // to finish — bouncing to /auth here would log out a returning user on every
  // page load. Only redirect once we know there is genuinely no session.
  if (isReconnecting) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <Loader2 size={28} className="spin icon-accent" />
      </div>
    );
  }
  if (!isConnected) {
    return (
      <Navigate
        to={`/auth?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  return children;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isLanding = location.pathname === "/";
  const isAuth = location.pathname === "/auth";
  const close = () => setOpen(false);

  return (
    <>
    <nav className="navbar">
      <Link to="/" className="logo" onClick={close}>
        <img src="/nav-logo.png" alt="EFG" className="logo-img" width="28" height="28" loading="eager" fetchPriority="high" decoding="async" />
      </Link>

      {!isLanding && !isAuth && (
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {!isAuth && (
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link to="/explore" onClick={close}>Explore</Link>
          <Link to="/create" onClick={close}>Create Project</Link>
          <Link to="/submit" onClick={close}>Submit Proof</Link>
          <Link to="/dashboard" onClick={close}>Dashboard</Link>

          <div className="nav-connect-widget">
            {!isLanding && (
              <ConnectButton
                accountStatus="avatar"
                chainStatus="icon"
                showBalance={false}
              />
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>
            <BrowserRouter>
              <div className="app">
                <Navbar />
                <main className="main">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                    <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
                    <Route path="/submit" element={<ProtectedRoute><SubmitEvidence /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
