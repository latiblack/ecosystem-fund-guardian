import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const location = window.location.pathname;
  const isLanding = location === "/";

  return (
    <>
    <nav className="navbar">
      <a href="/" className="logo" >
        <img src="/nav-logo.png" alt="EFG" className="logo-img" />
      </a>

      <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <a href="/explore" onClick={() => setIsOpen(false)}>Explore</a>
        <a href="/create" onClick={() => setIsOpen(false)}>Create Project</a>
        <a href="/submit" onClick={() => setIsOpen(false)}>Submit Proof</a>

        {!isLanding && <ConnectButton />}
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
