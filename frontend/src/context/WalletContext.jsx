import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { WalletConnectModal } from "@walletconnect/modal";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

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
  
  const providerRef = useRef(null);
  const modalRef = useRef(null);

  // Initialize WalletConnect modal and provider
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        // Create the WalletConnect modal
        modalRef.current = new WalletConnectModal({
          projectId: "7dbda9b31e7da7cb396ca5a5ae2f668e",
          chains: SUPPORTED_CHAINS,
          showQrModal: true,
          bridge: "wss://bridge.walletconnect.com",
          enableExplorer: false,
          metadata: {
            name: "Ecosystem Fund Guardian",
            description: "Decentralized ecosystem fund management with GenLayer AI verification",
            url: window.location.origin || "https://ecosystem-fund-guardian.vercel.app",
            icons: [(window.location.origin || "https://ecosystem-fund-guardian.vercel.app") + "/nav-logo.png"],
          },
        });
        
        // Initialize Ethereum provider
        const provider = await EthereumProvider.init({
          projectId: "7dbda9b31e7da7cb396ca5a5ae2f668e",
          chains: SUPPORTED_CHAINS.map(c => parseInt(c.split(":")[1])),
          showQrModal: true,
          metadata: {
            name: "Ecosystem Fund Guardian",
            description: "Decentralized ecosystem fund management with GenLayer AI verification",
            url: window.location.origin || "https://ecosystem-fund-guardian.vercel.app",
            icons: [(window.location.origin || "https://ecosystem-fund-guardian.vercel.app") + "/nav-logo.png"],
          },
        });
        
        providerRef.current = provider;
        
        // Listen for connect events
        provider.on("connect", (args) => {
          console.log("WalletConnect connected:", args);
          const accounts = args.result?.accounts || [];
          if (accounts.length > 0) {
            const address = accounts[0];
            setAddress(address);
            setIsConnected(true);
            setWalletType("WalletConnect");
            setError(null);
          }
        });
        
        provider.on("disconnect", () => {
          setAddress(null);
          setIsConnected(false);
          setWalletType(null);
        });
        
        provider.on("accountsChanged", (accounts) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });
        
        provider.on("chainChanged", (chainId) => {
          setChainId(chainId);
        });
        
        // Check for existing sessions
        const sessions = provider.session?.namespaces;
        if (sessions && Object.keys(sessions).length > 0) {
          const accounts = sessions["eip155"]?.accounts || [];
          if (accounts.length > 0) {
            const address = accounts[0].split(":")[2];
            setAddress(address);
            setIsConnected(true);
            setWalletType("WalletConnect");
          }
        }
        
      } catch (err) {
        console.error("Failed to initialize WalletConnect:", err);
      }
    };
    
    initWalletConnect();
    
    // Check for injected wallets
    if (typeof window !== "undefined" && window.ethereum) {
      if (window.ethereum.isMetaMask) setWalletType("MetaMask");
      else if (window.ethereum.isCoinbaseWallet) setWalletType("Coinbase Wallet");
      else if (window.ethereum.isRainbow) setWalletType("Rainbow");
      else setWalletType("Injected Wallet");
      
      // Check initial connection state
      checkInjectedConnection();
      setupInjectedListeners();
    }
    
    return () => {
      // Cleanup
      if (providerRef.current) {
        providerRef.current.off?.("connect");
        providerRef.current.off?.("disconnect");
        providerRef.current.off?.("accountsChanged");
        providerRef.current.off?.("chainChanged");
      }
      
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
  
  // Connect via WalletConnect QR modal
  const connectWalletConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    
    try {
      if (!modalRef.current) {
        throw new Error("WalletConnect not initialized");
      }
      
      // Open the WalletConnect modal
      await modalRef.current.openModal();
      
      // The modal handles the connection automatically
      // We wait for the connect event
      return true;
    } catch (err) {
      console.error("WalletConnect failed:", err);
      setError(err.message || "Failed to connect via WalletConnect");
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);
  
  // Connect via injected wallet (MetaMask, etc.)
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
  const disconnect = useCallback(async () => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setWalletType(null);
    setError(null);
    
    // Disconnect WalletConnect if connected
    if (providerRef.current && providerRef.current.session) {
      try {
        await providerRef.current.disconnect();
      } catch (err) {
        console.error("Failed to disconnect WalletConnect:", err);
      }
    }
    
    // Close modal if open
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
    wcModal: modalRef.current,
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
