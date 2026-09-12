import { createContext, useContext, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const WalletContext = createContext(null);

export const useWalletAuth = () => {
  const { address, isConnected, chain, status, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      const injected = connectors.find((c) => c.type === "injected");
      connect({ connector: injected || connectors[0] });
    }
  }, [connect, connectors, openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Check if user can access protected routes
  const canAccessProtectedContent = isConnected && !!address;

  return {
    user: canAccessProtectedContent ? { userId: address, chainId: chain?.id } : null,
    isAuthenticated: canAccessProtectedContent,
    canAccessProtectedContent,
    walletAddress: address,
    chainId: chain?.id,
    status,
    // active wagmi connector — works for WalletConnect/QR sessions too
    connector,
    // true while wagmi rehydrates a persisted connection from localStorage —
    // routes must NOT redirect on "disconnected" during this window
    isReconnecting: status === "reconnecting" || status === "connecting",
    provider: typeof window !== "undefined" ? window.ethereum : null,
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
