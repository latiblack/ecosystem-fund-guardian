import { useState, useEffect } from "react";
import { X, Wallet, ChevronRight, Copy, Check } from "lucide-react";
import { useWallet } from "../context/WalletContext";

const WALLET_OPTIONS = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect with MetaMask browser extension",
    installed: typeof window !== "undefined" && !!window.ethereum?.isMetaMask,
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect with Coinbase Wallet",
    installed: typeof window !== "undefined" && !!window.ethereum?.isCoinbaseWallet,
    installUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Connect with Rainbow wallet",
    installed: false,
    installUrl: "https://rainbow.me",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan QR code with your mobile wallet",
    installed: false,
    installUrl: "#",
  },
];

export default function WalletModal({ isOpen, onClose }) {
  const { address, connect, disconnect, chainId, chainName, error } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedWallet(null);
    }
  }, [isOpen]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (walletId) => {
    setSelectedWallet(walletId);
    setConnecting(true);
    
    try {
      const success = await connect();
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="wallet-modal-content">
          {error && (
            <div className="wallet-error">
              {error}
            </div>
          )}

          {address ? (
            // Connected State
            <div className="wallet-connected">
              <div className="connected-info">
                <div className="wallet-icon">
                  <Wallet size={24} />
                </div>
                <div className="wallet-details">
                  <p className="connected-label">Connected</p>
                  <p className="connected-address">
                    {address.slice(0, 6)}...{address.slice(-4)}
                    <button onClick={handleCopyAddress} className="copy-btn">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </p>
                  {chainName && (
                    <p className="connected-chain">{chainName}</p>
                  )}
                </div>
              </div>
              <button className="btn btn-outline btn-full" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : selectedWallet ? (
            // Selecting Wallet State
            <div className="wallet-selecting">
              <button 
                className="back-btn" 
                onClick={() => setSelectedWallet(null)}
              >
                ← Back
              </button>
              <p className="selecting-text">
                Opening {WALLET_OPTIONS.find(w => w.id === selectedWallet)?.name || 'wallet'}...
              </p>
              {connecting && (
                <div className="spinner"></div>
              )}
              {!connecting && (
                <p className="install-hint">
                  If the wallet didn't open,{" "}
                  <a href={WALLET_OPTIONS.find(w => w.id === selectedWallet)?.installUrl} target="_blank" rel="noopener noreferrer">
                    install it here
                  </a>
                </p>
              )}
            </div>
          ) : (
            // Wallet Selection State
            <>
              <p className="modal-description">
                Choose a wallet to connect. You'll be prompted to approve the connection.
              </p>
              <div className="wallet-options">
                {WALLET_OPTIONS.map((wallet) => (
                  <button
                    key={wallet.id}
                    className={`wallet-option ${!wallet.installed ? 'not-installed' : ''}`}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={!wallet.installed && connecting}
                  >
                    <div className="wallet-option-left">
                      <div className="wallet-option-icon">
                        <Wallet size={20} />
                      </div>
                      <div className="wallet-option-info">
                        <span className="wallet-option-name">{wallet.name}</span>
                        <span className="wallet-option-desc">{wallet.description}</span>
                      </div>
                    </div>
                    <div className="wallet-option-right">
                      {wallet.installed ? (
                        <ChevronRight size={18} />
                      ) : (
                        <span className="install-badge">Install</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="modal-footer">
                By connecting, you agree to the terms of service.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
