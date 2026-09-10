import { createContext, useContext, useState, useCallback, useEffect } from "react";

const WalletContext = createContext(null);

// EVM chain names for display
const CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  5: "Goerli",
  10: "Optimism",
  420: "Optimism Goerli",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Polygon Mumbai",
  42161: "Arbitrum One",
  421613: "Arbitrum Goerli",
  421614: "Arbitrum Nova",
  11155420: "Sepolia Arbitrum",
  56: "BNB Smart Chain",
  97: "BNB Testnet",
  43114: "Avalanche C-Chain",
  43113: "Avalanche Fuji",
  250: "Fantom Opera",
  4002: "Fantom Testnet",
  100: "Gnosis Chain",
  10: "Optimism",
};

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  const getChainName = useCallback((id) => {
    return CHAIN_NAMES[id] || `Chain ID: ${id}`;
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setError(null);
      } else {
        setAddress(null);
      }
    };

    const handleChainChanged = (chainHex) => {
      const id = parseInt(chainHex, 16);
      setChainId(id);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask or another EVM wallet.");
      return false;
    }

    setConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const id = parseInt(chainIdHex, 16);
      
      setAddress(accounts[0]);
      setChainId(id);
      return true;
    } catch (err) {
      console.error("Wallet connect failed:", err);
      if (err.code === 4001) {
        setError("Connection rejected by user.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (err) {
      console.error("Failed to switch chain:", err);
      return false;
    }
  }, []);

  const value = {
    address,
    chainId,
    chainName: chainId ? getChainName(chainId) : null,
    connecting,
    error,
    connect,
    disconnect,
    switchChain,
    isConnected: !!address,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}

// Hook to check if user is on a specific chain
export function useRequireChain(requiredChainId) {
  const { chainId, switchChain, error } = useWallet();
  
  useEffect(() => {
    if (chainId && chainId !== requiredChainId) {
      switchChain(requiredChainId);
    }
  }, [chainId, requiredChainId, switchChain]);
  
  return { chainId, isCorrectChain: chainId === requiredChainId, error };
}
