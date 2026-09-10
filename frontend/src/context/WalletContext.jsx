import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { WalletConnectModal } from "@walletconnect/modal";

const WalletContext = createContext(null);

// Supported chains for Ecosystem Fund Guardian
const SUPPORTED_CHAINS = [
  "eip155:1",    // Ethereum Mainnet
  "eip155:5",    // Goerli Testnet
  "eip155:10",   // Optimism
  "eip155:56",   // BNB Smart Chain
  "eip155:137",  // Polygon
  "eip155:42161", // Arbitrum One
  "eip155:43114", // Avalanche C-Chain
  "eip155:11155111", // Sepolia
];

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WalletConnect modal with project ID
  const wcModal = new WalletConnectModal({
    projectId: "7dbda9b31e7da7cb396ca5a5ae2f668e",
    chains: SUPPORTED_CHAINS,
    additionalChains: SUPPORTED_CHAINS,
    supportedUnsafeMethods: ["personal_sign", "eth_signTypedData_v4"],
    metadata: {
      name: "Ecosystem Fund Guardian",
      description: "Decentralized ecosystem fund management with GenLayer AI verification",
      url: window.location.origin || "https://ecosystem-fund-guardian.vercel.app",
      icons: [(window.location.origin || "https://ecosystem-fund-guardian.vercel.app") + "/nav-logo.png"],
    },
  });

  // Check for injected wallet (MetaMask, etc.)
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      // Detect wallet type
      if (window.ethereum.isMetaMask) setWalletType("MetaMask");
      else if (window.ethereum.isCoinbaseWallet) setWalletType("Coinbase Wallet");
      else if (window.ethereum.isRainbow) setWalletType("Rainbow");
      else setWalletType("Injected Wallet");

      // Check initial connection
      checkInjectedConnection();
      setupInjectedListeners();
    }

    return () => {
      // Cleanup listeners
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

  // Connect via WalletConnect (QR code modal)
  const connectWalletConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      // Open WalletConnect modal
      await wcModal.openModal();
      
      // The modal handles the connection automatically
      // We need to listen for session events
      
      // Listen for session approved
      const sessionApprovedHandler = (event) => {
        if (event.name === "session_approved") {
          const accounts = event.data?.accounts || [];
          if (accounts.length > 0) {
            const address = accounts[0];
            const chainId = parseInt(accounts[0].split(":")[1], 16);
            setAddress(address);
            setChainId(chainId);
            setIsConnected(true);
            setWalletType("WalletConnect");
            setError(null);
            wcModal.closeModal();
          }
        }
      };

      // Listen for session rejected
      const sessionRejectedHandler = (event) => {
        if (event.name === "session_rejected") {
          setError("Connection rejected by wallet");
        }
      };

      // Note: WalletConnect modal handles sessions internally
      // We just need to wait for the modal to close and check connection status
      
      return true;
    } catch (err) {
      console.error("WalletConnect failed:", err);
      setError(err.message || "Failed to connect via WalletConnect");
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

  // Main connect function - tries injected first, falls back to WalletConnect
  const connect = useCallback(async () => {
    // Try injected wallet first if available
    if (window.ethereum) {
      return await connectInjected();
    }

    // Fall back to WalletConnect
    return await connectWalletConnect();
  }, [connectInjected, connectWalletConnect]);

  // Disconnect
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setWalletType(null);
    setError(null);

    // Close WalletConnect modal if open
    if (wcModal.isOpen) {
      wcModal.closeModal();
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
    wcModal,
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
