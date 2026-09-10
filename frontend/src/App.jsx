import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import { metaMask, coinbaseWallet, baseAccount, walletConnect } from "@wagmi/connectors";
import { mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia } from "wagmi/chains";
import { RainbowKitProvider, ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useState } from "react";
import { Menu, X, Wallet } from "lucide-react";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import ProjectDetail from "./pages/ProjectDetail";
import CreateCampaign from "./pages/CreateCampaign";
import SubmitEvidence from "./pages/SubmitEvidence";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";

// WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = "7dbda9b31e7da7cb396ca5a5ae2f668e";

// Get default wallets with our WalletConnect projectId
const { connectors: defaultConnectors } = getDefaultWallets({
  appName: "Ecosystem Fund Guardian",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia],
});

// Create wagmi config
const config = createConfig({
  chains: [mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: defaultConnectors,
  ssr: true,
});

const queryClient = new QueryClient();

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = window.location.pathname;
  const isLanding = location === "/";
  const close = () => setOpen(false);

  return (
    <>
    <nav className="navbar">
      <Link to="/" className="logo" onClick={close}>
        <img src="/nav-logo.png" alt="EFG" className="logo-img" />
      </Link>

      {!isLanding && (
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      <div className={`nav-links ${open ? "open" : ""}`}>
        <Link to="/explore" onClick={close}>Explore</Link>
        <Link to="/create" onClick={close}>Create Project</Link>
        <Link to="/submit" onClick={close}>Submit Proof</Link>

        {!isLanding && (
          <ConnectButton />
        )}
      </div>
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
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/project/:id" element={<ProjectDetail />} />
                    <Route path="/create" element={<CreateCampaign />} />
                    <Route path="/submit" element={<SubmitEvidence />} />
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
