import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const modalRef = useRef(null);

  // Initialize WalletConnect modal on component mount
  useEffect(() => {
    // Check for injected wallet
    if (typeof window !== "undefined" && window.ethereum) {
      if (window.ethereum.isMetaMask) setWalletType("MetaMask");
      else if (window.ethereum.isCoinbaseWallet) setWalletType("Coinbase Wallet");
      else if (window.ethereum.isRainbow) setWalletType("Rainbow");
      else setWalletType("Injected Wallet");
      
      checkInjectedConnection();
      setupInjectedListeners();
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.("accountsChanged", () => {});
        window.ethereum.removeListener?.("chainChanged", () => {});
      }
    };
  }, []);

  const checkInjectedConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (err) {
      console.error("Failed to check injected wallet:", err);
    }
  };

  const setupInjectedListeners = () => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setError(null);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    };
    
    const handleChainChanged = (chainHex) => {
      setChainId(parseInt(chainHex, 16));
    };
    
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  };

  // Open WalletConnect modal (this is the native WC modal)
  const connectWalletConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Dynamically import WalletConnectModal to avoid SSR issues
      const { WalletConnectModal } = await import("@walletconnect/modal");
      
      // Create or get existing modal
      if (!modalRef.current) {
        modalRef.current = new WalletConnectModal({
          projectId: "7dbda9b31e7da7cb396ca5a5ae2f668e",
          chains: ["eip155:1", "eip155:137", "eip155:42161", "eip155:56", "eip155:10", "eip155:43114"],
          supportedChains: ["eip155:1", "eip155:137", "eip155:42161", "eip155:56", "eip155:10", "eip155:43114"],
          metadata: {
            name: "Ecosystem Fund Guardian",
            description: "Decentralized ecosystem fund management",
            url: window.location.origin,
            icons: [`${window.location.origin}/nav-logo.png`],
          },
        });
      }
      
      // Open the modal - this shows the official WalletConnect UI
      await modalRef.current.openModal();
      
      // Wait for connection (the modal handles this)
      return true;
    } catch (err) {
      console.error("WalletConnect failed:", err);
      setError(err.message || "Failed to open WalletConnect");
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Connect via injected wallet
  const connectInjected = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
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
      setIsConnected(true);
      
      return true;
    } catch (err) {
      console.error("Injected wallet connection failed:", err);
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

  // Main connect function
  const connect = useCallback(async () => {
    // Try injected wallet first if available
    if (window.ethereum) {
      return await connectInjected();
    }
    
    // Fall back to WalletConnect modal
    return await connectWalletConnect();
  }, [connectInjected, connectWalletConnect]);

  // Disconnect
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setWalletType(null);
    setError(null);
    
    if (modalRef.current?.isOpen) {
      modalRef.current.closeModal();
    }
  }, []);

  // Switch chain
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

  // Sign message
  const signMessage = useCallback(async (message) => {
    if (!address || !window.ethereum) {
      throw new Error("Wallet not connected");
    }
    
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });
    
    return signature;
  }, [address]);

  const value = {
    address,
    chainId,
    chainName: chainId ? `Chain ${chainId}` : null,
    walletType,
    connecting,
    error,
    connect,
    connectWalletConnect,
    connectInjected,
    disconnect,
    switchChain,
    signMessage,
    isConnected,
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

export function useRequireWallet() {
  const { isConnected, connect, error } = useWallet();
  
  const ensureConnected = useCallback(async () => {
    if (!isConnected) {
      await connect();
    }
    return isConnected;
  }, [isConnected, connect]);
  
  return { isConnected, ensureConnected, error };
}
