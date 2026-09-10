import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import { metaMask, coinbaseWallet, baseAccount, walletConnect } from "@wagmi/connectors";
import { mainnet, polygon, arbitrum, bsc, optimism, avalanche, sepolia } from "wagmi/chains";
import { RainbowKitProvider, ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import CreateCampaign from "./pages/CreateCampaign";
import WalletProvider from "./context/WalletContext";
import Navbar from "./components/Navbar";

const WALLETCONNECT_PROJECT_ID = "7dbda9b31e7da7cb396ca5a5ae2f668e";
const { connectors } = getDefaultWallets({ appName: "Ecosystem Fund Guardian", projectId: WALLETCONNECT_PROJECT_ID });

const wagmiConfig = createConfig({
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
  connectors: [
    ...connectors,
    metaMask({ shimDisconnect: true }),
    baseAccount({ apiKey: import.meta.env.VITE_BASE_API_KEY || undefined }),
  ],
});

const queryClient = new QueryClient();

// Auth Guard Component
function ProtectedRoute({ children, requireAuth = true }) {
  const { isConnected } = useAccount();
  
  if (requireAuth && !isConnected) {
    // Redirect to landing page where they can see the connect button
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  
  return (
    <div className="app">
      <Navbar 
        isConnected={isConnected} 
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/explore" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Explore />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute requireAuth={true}>
              <CreateCampaign />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
