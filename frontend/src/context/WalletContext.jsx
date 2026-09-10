import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const WalletContext = createContext(null);

export const useWalletAuth = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [lastKnownAddress, setLastKnownAddress] = useState(null);

  // Persist last known address for better UX
  useEffect(() => {
    if (isConnected && address) {
      setLastKnownAddress(address);
      localStorage.setItem('lastWalletAddress', address);
    }
  }, [isConnected, address]);

  // Restore last known address on load and trigger reconnect
  useEffect(() => {
    const savedAddress = localStorage.getItem('lastWalletAddress');
    if (savedAddress && !isConnected) {
      // Try to auto-reconnect on page reload
      const injected = connectors.find(c => c.type === "injected");
      if (injected) {
        connect({ connector: injected });
      }
    }
  }, []);

  const isAuthenticated = isConnected || !!lastKnownAddress;
  const walletAddress = address || lastKnownAddress;
  const provider = typeof window !== "undefined" ? window.ethereum : null;

  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      const injected = connectors.find(c => c.type === "injected");
      connect({ connector: injected || connectors[0] });
    }
  }, [connect, connectors, openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setLastKnownAddress(null);
    localStorage.removeItem('lastWalletAddress');
  }, [disconnect]);

  // Check if user can access protected routes
  const canAccessProtectedContent = isConnected && !!address;

  return {
    user: isAuthenticated ? { userId: walletAddress || "", chainId: chain?.id } : null,
    isAuthenticated,
    canAccessProtectedContent,
    walletAddress,
    chainId: chain?.id,
    provider,
    connectWallet,
    disconnectWallet,
    address,
    isConnected,
    chain,
  };
};

export default function WalletProvider({ children }) {
  const auth = useWalletAuth();

  return (
    <WalletContext.Provider value={auth}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}

/**
 * Hook that requires wallet connection
 * Returns true if user is properly authenticated with wallet
 */
export function useRequireWallet() {
  const { isAuthenticated, connectWallet, canAccessProtectedContent } = useWallet();
  
  return {
    isAuthenticated,
    connectWallet,
    canAccessProtectedContent,
  };
}
