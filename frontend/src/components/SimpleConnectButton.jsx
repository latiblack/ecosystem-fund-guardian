import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useNetwork } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, LogOut } from "lucide-react";

export default function SimpleConnectButton({ 
  accountStatus = "full", 
  chainStatus = "icon",
  showBalance = false,
  chainId,
  address: propAddress,
  connector,
  disconnect
}) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { chain } = useNetwork();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // If already connected externally, show connected state
  if (propAddress && connector) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {propAddress?.slice(0, 6)}...{propAddress?.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text)",
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnectWallet()}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text)",
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <button
      onClick={() => {
        const injected = connectors.find((c) => c.type === "injected");
        if (injected) {
          connect({ connector: injected });
        } else {
          alert("Please install a wallet like MetaMask");
        }
      }}
      style={{
        background: "var(--accent)",
        color: "#000",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      disabled={isLoading || isConnecting}
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
}