import { useState, useEffect } from "react";
import { X, Wallet, ChevronRight, Copy, Check, QrCode, Smartphone } from "lucide-react";
import { useWallet } from "../context/WalletContext";

const WALLET_OPTIONS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    color: "#f6851b",
    description: "Browser extension wallet",
    type: "injected",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "©️",
    color: "#0052ff",
    description: "Self-custody crypto wallet",
    type: "injected",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "⬡",
    color: "#3b99fc",
    description: "Connect via QR code scan",
    type: "qr",
  },
];

export default function WalletModal({ isOpen, onClose }) {
  const {
    address,
    chainId,
    walletType,
    connecting,
    error,
    connect,
    disconnect,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
    }
  }, [isOpen]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (option) => {
    setSelectedOption(option);

    try {
      const success = await connect();
      if (success && address) {
        onClose();
      }
    } catch (err) {
      console.error("Connection failed:", err);
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
          maxWidth: 420,
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
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
          ) : selectedOption ? (
            // Connecting State
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: "rgba(212, 255, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wallet size={32} style={{ color: "var(--accent)" }} />
              </div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Opening{" "}
                {WALLET_OPTIONS.find((w) => w.id === selectedOption)?.name ||
                  "wallet"}
                ...
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-dim)",
                  marginBottom: 24,
                }}
              >
                {selectedOption === "walletconnect"
                  ? "Scan the QR code with your mobile wallet"
                  : "Approve the connection in your wallet"}
              </p>
              {connecting && (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: "3px solid var(--border)",
                      borderTopColor: "var(--accent)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                </div>
              )}
              {!connecting && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-dim)",
                    marginTop: 16,
                  }}
                >
                  If the wallet didn't open,{" "}
                  <a
                    href={
                      selectedOption === "metamask"
                        ? "https://metamask.io/download/"
                        : selectedOption === "coinbase"
                        ? "https://www.coinbase.com/wallet"
                        : "https://walletconnect.com/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent)", textDecoration: "none" }}
                  >
                    install it here
                  </a>
                </p>
              )}
              <button
                onClick={() => setSelectedOption(null)}
                style={{
                  marginTop: 24,
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ← Back
              </button>
            </div>
          ) : (
            // Wallet Selection State
            <>
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                Choose a wallet to connect. You'll be prompted to approve the
                connection.
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {WALLET_OPTIONS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={connecting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      cursor: connecting ? "not-allowed" : "pointer",
                      color: "var(--text)",
                      fontSize: 15,
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: wallet.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                        }}
                      >
                        {wallet.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{wallet.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {wallet.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      style={{ color: "var(--text-dim)" }}
                    />
                  </button>
                ))}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
