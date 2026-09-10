import { useState, useEffect, useRef } from "react";
import { X, Wallet, Copy, Check } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export default function WalletModal({ isOpen, onClose }) {
  const { 
    address, 
    chainId, 
    walletType, 
    error, 
    connect, 
    connectWalletConnect,
    disconnect,
    isConnected 
  } = useWallet();
  
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize WalletConnect modal when opening
      initWalletConnectModal();
    }
  }, [isOpen]);

  const initWalletConnectModal = async () => {
    try {
      const { WalletConnectModal } = await import("@walletconnect/modal");
      
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
    } catch (err) {
      console.error("Failed to init WalletConnect modal:", err);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectWalletConnect = async () => {
    try {
      // Open the native WalletConnect modal
      if (modalRef.current) {
        await modalRef.current.openModal();
      } else {
        await connectWalletConnect();
      }
    } catch (err) {
      console.error("Failed to open WalletConnect modal:", err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
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

          {address ? (
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
                      {address.slice(0, 6)}...{address.slice(-4)}
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
            // Selection State - Show WalletConnect option that opens native modal
            <>
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                Choose a wallet to connect.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* MetaMask / Injected Wallet */}
                <button
                  onClick={async () => {
                    const success = await connect();
                    if (success) onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    cursor: "pointer",
                    color: "var(--text)",
                    fontSize: 15,
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#f6851b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      🦊
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>MetaMask</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        Browser extension
                      </div>
                    </div>
                  </div>
                </button>

                {/* WalletConnect - Opens native WC modal */}
                <button
                  onClick={handleConnectWalletConnect}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    cursor: "pointer",
                    color: "var(--text)",
                    fontSize: 15,
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#3b99fc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      ⬡
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>WalletConnect</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        Scan QR code with mobile wallet
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginTop: 20,
                  textAlign: "center",
                }}
              >
                By connecting, you agree to our Terms of Service
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
