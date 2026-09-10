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

  useEffect(() => {
    if (isConnected && address) setLastKnownAddress(address);
  }, [isConnected, address]);

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
  }, [disconnect]);

  return {
    user: isAuthenticated ? { userId: walletAddress || "" } : null,
    isAuthenticated,
    walletAddress,
    provider,
    connectWallet,
    disconnectWallet,
    address,
    isConnected,
    chain,
  };
};

export function WalletProvider({ children }) {
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

export function useRequireWallet() {
  const { isAuthenticated, connectWallet, user } = useWallet();

  const ensureConnected = useCallback(async () => {
    if (!isAuthenticated) {
      connectWallet();
    }
    return isAuthenticated;
  }, [isAuthenticated, connectWallet]);

  return { isAuthenticated, ensureConnected, user };
}
