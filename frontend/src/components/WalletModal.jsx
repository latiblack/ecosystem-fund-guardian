import { useState } from "react";
import { X, Wallet, Copy, Check } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export default function WalletModal({ isOpen, onClose }) {
  const { 
    address, 
    chainId, 
    walletType, 
    error, 
    connectWallet,
    disconnectWallet,
    isAuthenticated 
  } = useWallet();
  
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Connect Wallet
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-dim)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {error && (
            <div
              style={{
                padding: 12,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 8,
                color: "#ef4444",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {isAuthenticated ? (
            // Connected State
            <div>
              <div
                style={{
                  padding: 16,
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wallet size={20} style={{ color: "#000" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                      Connected
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "var(--text-dim)",
                      }}
                    >
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--text-dim)",
                    }}
                  >
                    {copied ? (
                      <Check size={16} style={{ color: "#22c55e" }} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <div
                  style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)" }}
                >
                  {chainId && <span>Chain ID: {chainId} • </span>}
                  {walletType && <span>{walletType}</span>}
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            // Not connected - just show info about using RainbowKit
            <>
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                Click the "Connect Wallet" button in the navbar to open the wallet connection modal.
              </p>
              
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <button
                  onClick={() => {
                    connectWallet();
                    onClose();
                  }}
                  style={{
                    padding: "12px 24px",
                    background: "var(--accent)",
                    color: "#000",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Connect Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
