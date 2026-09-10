import { createContext, useContext, useState, useCallback, useEffect } from "react";

const WalletContext = createContext(null);

// Full EVM chain support - any valid chain ID works
const CHAIN_CONFIG = {
  1: { name: "Ethereum", symbol: "ETH", rpc: "https://ethereum.publicnode.com" },
  5: { name: "Goerli", symbol: "ETH", rpc: "https://rpc.ankr.com/eth_goerli" },
  10: { name: "Optimism", symbol: "ETH", rpc: "https://mainnet.optimism.io" },
  420: { name: "Optimism Goerli", symbol: "ETH", rpc: "https://goerli.optimism.io" },
  56: { name: "BNB Smart Chain", symbol: "BNB", rpc: "https://bsc-dataseed.binance.org" },
  97: { name: "BNB Testnet", symbol: "tBNB", rpc: "https://data-seed-prebsc-1-s1.binance.org:8545" },
  137: { name: "Polygon", symbol: "MATIC", rpc: "https://polygon-rpc.com" },
  80001: { name: "Polygon Mumbai", symbol: "MATIC", rpc: "https://rpc-mumbai.maticvigil.com" },
  42161: { name: "Arbitrum One", symbol: "ETH", rpc: "https://arb1.arbitrum.io/rpc" },
  421613: { name: "Arbitrum Goerli", symbol: "ETH", rpc: "https://goerli-rollup.arbitrum.io/rpc" },
  421614: { name: "Arbitrum Nova", symbol: "ETH", rpc: "https://nova.arbitrum.io/rpc" },
  11155111: { name: "Sepolia", symbol: "ETH", rpc: "https://rpc.sepolia.org" },
  43114: { name: "Avalanche C-Chain", symbol: "AVAX", rpc: "https://api.avax.network/ext/bc/C/rpc" },
  43113: { name: "Avalanche Fuji", symbol: "AVAX", rpc: "https://api.avax-test.network/ext/bc/C/rpc" },
  250: { name: "Fantom Opera", symbol: "FTM", rpc: "https://rpc.ftm.tools" },
  4002: { name: "Fantom Testnet", symbol: "FTM", rpc: "https://rpc.testnet.fantom.network" },
  100: { name: "Gnosis Chain", symbol: "xDAI", rpc: "https://rpc.gnosischain.com" },
};

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null);

  // Detect wallet type from provider
  const detectWalletType = useCallback(() => {
    if (!window.ethereum) return null;
    if (window.ethereum.isMetaMask) return "MetaMask";
    if (window.ethereum.isCoinbaseWallet) return "Coinbase Wallet";
    if (window.ethereum.isRainbow) return "Rainbow";
    if (window.ethereum.isBlockwallet) return "Blockwallet";
    if (window.ethereum.isTaho) return "Taho";
    if (window.ethereum.isExodus) return "Exodus";
    return "Other EVM Wallet";
  }, []);

  const getChainInfo = useCallback((id) => {
    return CHAIN_CONFIG[id] || { 
      name: `Chain ${id}`, 
      symbol: "Native Token",
      rpc: null 
    };
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    setWalletType(detectWalletType());

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setError(null);
      } else {
        setAddress(null);
        setChainId(null);
      }
    };

    const handleChainChanged = (chainHex) => {
      const id = parseInt(chainHex, 16);
      setChainId(id);
    };

    const handleConnect = (connectInfo) => {
      setAddress(connectInfo.account);
      setChainId(parseInt(connectInfo.chainId, 16));
      setError(null);
    };

    const handleDisconnect = () => {
      setAddress(null);
      setChainId(null);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("connect", handleConnect);
    window.ethereum.on("disconnect", handleDisconnect);

    // Check initial state
    window.ethereum.request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      })
      .catch(console.error);

    window.ethereum.request({ method: "eth_chainId" })
      .then((chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
      })
      .catch(console.error);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("connect", handleConnect);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [detectWalletType]);

  // Connect wallet - supports ANY EVM-compatible wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
      return false;
    }

    setConnecting(true);
    setError(null);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      // Get chain ID
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const id = parseInt(chainIdHex, 16);
      
      // Validate it's a proper EVM chain
      if (isNaN(id) || id < 1) {
        throw new Error("Invalid EVM chain detected");
      }
      
      setAddress(accounts[0]);
      setChainId(id);
      setWalletType(detectWalletType());
      return true;
    } catch (err) {
      console.error("Wallet connection failed:", err);
      
      if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection in your wallet.");
      } else if (err.code === -32002) {
        setError("Connection request already pending. Please check your wallet.");
      } else {
        setError(err.message || "Failed to connect wallet. Please try again.");
      }
      return false;
    } finally {
      setConnecting(false);
    }
  }, [detectWalletType]);

  // Disconnect from wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setWalletType(null);
    setError(null);
  }, []);

  // Switch to a different chain
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
      
      // If chain doesn't exist, try to add it
      if (err.code === 4902) {
        const config = CHAIN_CONFIG[targetChainId];
        if (config) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: config.name,
                nativeCurrency: {
                  name: config.symbol,
                  symbol: config.symbol,
                  decimals: 18,
                },
                rpcUrls: [config.rpc],
                blockExplorerUrls: [
                  targetChainId === 1 ? "https://etherscan.io" :
                  targetChainId === 137 ? "https://polygonscan.com" :
                  targetChainId === 56 ? "https://bscscan.com" :
                  targetChainId === 42161 ? "https://arbiscan.io" :
                  undefined
                ].filter(Boolean),
              }],
            });
            return true;
          } catch (addErr) {
            console.error("Failed to add chain:", addErr);
            setError("Failed to add network to wallet");
            return false;
          }
        }
      }
      
      setError("Failed to switch network. Make sure your wallet supports this chain.");
      return false;
    }
  }, []);

  // Sign a message (works on ANY EVM chain)
  const signMessage = useCallback(async (message) => {
    if (!address || !window.ethereum) {
      throw new Error("Wallet not connected");
    }
    
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainIdHex, 16);
    
    if (isNaN(currentChainId) || currentChainId < 1) {
      throw new Error("Not on a valid EVM chain");
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
    chainName: chainId ? getChainInfo(chainId).name : null,
    chainSymbol: chainId ? getChainInfo(chainId).symbol : null,
    walletType,
    connecting,
    error,
    connect,
    disconnect,
    switchChain,
    signMessage,
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

// Hook to require being on any valid EVM chain
export function useEVMChain() {
  const { chainId, error } = useWallet();
  
  // Any valid chainId is acceptable for EVM compatibility
  const isValidChain = chainId !== null && !isNaN(chainId) && chainId >= 1;
  
  return { chainId, isValidChain, error };
}
