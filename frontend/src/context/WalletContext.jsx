import { createContext, useContext, useState, useCallback } from "react";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another EVM wallet.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);
    } catch (err) {
      console.error("Wallet connect failed:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  // Listen for account changes
  if (typeof window !== "undefined" && window.ethereum) {
    window.ethereum.on?.("accountsChanged", (accounts) => {
      setAddress(accounts[0] || null);
    });
  }

  return (
    <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}
