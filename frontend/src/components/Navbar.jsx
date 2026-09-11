import { Menu, X } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export default function Navbar({ isConnected, isMobileMenuOpen, onToggleMenu }) {
  const { connectWallet, disconnectWallet, walletAddress } = useWallet();
  
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <a href="/" className="nav-logo">
            <img src="/nav-logo.png" alt="Logo" className="nav-logo-img" />
            <span className="nav-title">Ecosystem Fund Guardian</span>
          </a>
        </div>
        
        {/* Desktop Navigation */}
        <div className="nav-center">
          <a href="/explore" className="nav-link">Explore</a>
          <a href="/create" className="nav-link">Create Project</a>
        </div>
        
        {/* Desktop Wallet Connection */}
        <div className="nav-right">
          <ConnectButton />
        </div>
        
        {/* Mobile Menu Button - Lemon colored */}
        <button 
          className="mobile-menu-btn"
          onClick={onToggleMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X size={24} color="#d4ff00" />
          ) : (
            <Menu size={24} color="#d4ff00" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <a href="/explore" className="mobile-menu-item" onClick={onToggleMenu}>
            Explore
          </a>
          <a href="/create" className="mobile-menu-item" onClick={onToggleMenu}>
            Create Project
          </a>
          
          {/* Mobile Wallet Status */}
          {isConnected && walletAddress ? (
            <div className="mobile-wallet-status">
              <div className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <button 
                className="btn btn-small btn-outline"
                onClick={() => disconnectWallet()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary mobile-menu-item"
              onClick={() => {
                connectWallet();
                onToggleMenu();
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
