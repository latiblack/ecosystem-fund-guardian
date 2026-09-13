import { createContext, useContext, useCallback, useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const WalletContext = createContext(null);

export const useWalletAuth = () => {
  const { address, isConnected, chain, connector, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  // wagmi v2 exposes reconnection through the account status:
  //   'connecting' | 'reconnecting' → persisted session is still being restored
  //   'connected'                   → session ready, wallet available
  //   'disconnected'                → nothing persisted / user disconnected
  // ProtectedRoute must wait during 'reconnecting' instead of bouncing to /auth,
  // otherwise a returning user is sent to the auth page on every page load.
  const isReconnecting = status === "reconnecting" || status === "connecting";

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

  // Check if user can access protected routes — only once the persisted
  // session has finished restoring and a real address is available.
  const canAccessProtectedContent =
    status === "connected" && isConnected && !!address;

  // Get wallet type from connector name
  const walletType = useMemo(() => {
    if (!connector) return null;
    const name = connector.name || connector.title || "";
    if (name.toLowerCase().includes("metamask")) return "MetaMask";
    if (name.toLowerCase().includes("walletConnect") || name.toLowerCase().includes("wallet")) return "WalletConnect";
    if (name.toLowerCase().includes("coinbase")) return "Coinbase";
    return name;
  }, [connector]);

  // isReconnecting now comes straight from wagmi's account status (above).

  return {
    user: canAccessProtectedContent ? { userId: address, chainId: chain?.id } : null,
    isAuthenticated: canAccessProtectedContent,
    canAccessProtectedContent,
    walletAddress: address,
    chainId: chain?.id,
    connector,
    walletType,
    isReconnecting,
    provider: typeof window !== "undefined" && window.ethereum ? window.ethereum : null,
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
